import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { getRedisClient } from '../redis';
import { EditorError, requireValue } from './store';

const scrypt = promisify(scryptCallback);
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = '__Host-usegle-editor';
const hash = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
const sessionKey = (token: string): string => `editor:session:${hash(token)}`;

function credential(): string {
  const value = process.env.EDITOR_PASSWORD_HASH;
  if (!value || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(value))
    throw new EditorError(503, 'Editor password is not configured.');
  return value;
}

// Reserve attempts before the expensive hash, atomically across all instances.
// Limits are deliberately bounded even when the deployment cannot supply a trusted IP.
const limitScript = `
local account = tonumber(redis.call('GET', KEYS[1]) or '0')
local ip = tonumber(redis.call('GET', KEYS[2]) or '0')
if account >= 30 or ip >= 5 then return 0 end
for _, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then redis.call('EXPIRE', key, 900) end
end
return 1
`;

export async function login(password: unknown, clientIp: string) {
  const configured = credential();
  requireValue(
    typeof password === 'string' && password.length <= 1024,
    'Enter your password.',
  );
  const allowed = await getRedisClient().eval(limitScript, {
    keys: ['editor:login:account', `editor:login:ip:${hash(clientIp)}`],
    arguments: [],
  });
  if (!allowed)
    throw new EditorError(
      429,
      'Too many login attempts. Try again in 15 minutes.',
    );
  const [salt, expected] = configured.split(':');
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  if (!timingSafeEqual(actual, Buffer.from(expected, 'hex')))
    throw new EditorError(401, 'Incorrect password.');
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_SECONDS * 1000;
  await getRedisClient().set(
    sessionKey(token),
    JSON.stringify({ version: hash(configured), expires }),
    { EX: SESSION_SECONDS },
  );
  return { token, expires };
}

export function cookieToken(header?: string): string {
  return (
    header
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1) ?? ''
  );
}
export async function checkSession(token: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new EditorError(401, 'Sign in to the editor.');
  const raw = await getRedisClient().get(sessionKey(token));
  if (!raw) throw new EditorError(401, 'Your session expired. Sign in again.');
  const value = JSON.parse(raw);
  if (value.expires <= Date.now() || value.version !== hash(credential())) {
    await logout(token);
    throw new EditorError(401, 'Your session expired. Sign in again.');
  }
}
export async function logout(token: string): Promise<void> {
  if (/^[a-f0-9]{64}$/.test(token))
    await getRedisClient().del(sessionKey(token));
}
