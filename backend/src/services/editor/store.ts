import { getRedisClient } from '../redis';
import { addDays, getToday } from '../game-date';

export class EditorError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireValue(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new EditorError(400, message);
}
export type Decision = 'approved' | 'rejected';
export interface EditorState {
  today: string;
  revision: number;
  decisions: Record<string, Decision>;
  queue: { word: string; score: number }[];
  scheduled: Record<string, string>;
}
export interface Changes {
  decisions?: { word: string; decision: Decision | null }[];
  queue?: { word: string; score: number | null }[];
  assignments?: { date: string; word: string }[];
}

// Both snapshot and commit run in Redis, so even assignments written outside the
// editor are compared at commit time. Only date keys from today onward are read.
const snapshotScript = `
local scheduled = {}
for _, key in ipairs(redis.call('KEYS', '????-??-??')) do
  if key >= ARGV[1] and string.match(key, '^%d%d%d%d%-%d%d%-%d%d$') then
    scheduled[key] = redis.call('GET', key)
  end
end
return cjson.encode({ revision = tonumber(redis.call('GET', KEYS[1]) or '0'),
  decisions = redis.call('HGETALL', KEYS[2]), queue = redis.call('ZRANGE', KEYS[3], 0, -1, 'WITHSCORES'),
  scheduled = scheduled })
`;
const commitScript = `
local expected = cjson.decode(ARGV[1])
local change = cjson.decode(ARGV[2])
local now = tonumber(redis.call('TIME')[1])
if now < tonumber(ARGV[3]) or now >= tonumber(ARGV[4]) then return 0 end
if tonumber(redis.call('GET', KEYS[1]) or '0') ~= expected.revision then return 0 end
local count = 0
for _, key in ipairs(redis.call('KEYS', '????-??-??')) do
  if key >= expected.today and string.match(key, '^%d%d%d%d%-%d%d%-%d%d$') then
    if expected.scheduled[key] ~= redis.call('GET', key) then return 0 end
    count = count + 1
  end
end
local expectedCount = 0
for _ in pairs(expected.scheduled) do expectedCount = expectedCount + 1 end
if count ~= expectedCount then return 0 end
for _, item in ipairs(change.decisions or {}) do
  if item.decision == cjson.null then redis.call('HDEL', KEYS[2], item.word)
  else redis.call('HSET', KEYS[2], item.word, item.decision) end
end
for _, item in ipairs(change.queue or {}) do
  if item.score == cjson.null then redis.call('ZREM', KEYS[3], item.word)
  else redis.call('ZADD', KEYS[3], item.score, item.word) end
end
for _, item in ipairs(change.assignments or {}) do redis.call('SET', item.date, item.word) end
return redis.call('INCR', KEYS[1])
`;
const keys = ['editor:revision', 'editor:decisions', 'editor:queue'];

export async function readState(): Promise<EditorState> {
  const today = getToday();
  const raw = JSON.parse(
    (await getRedisClient().eval(snapshotScript, {
      keys,
      arguments: [today],
    })) as string,
  );
  const decisions: Record<string, Decision> = {};
  for (let i = 0; i < raw.decisions.length; i += 2)
    decisions[raw.decisions[i]] = raw.decisions[i + 1];
  const queue = [];
  for (let i = 0; i < raw.queue.length; i += 2)
    queue.push({ word: raw.queue[i], score: Number(raw.queue[i + 1]) });
  return {
    today,
    revision: raw.revision,
    decisions,
    queue,
    scheduled: raw.scheduled,
  };
}

export function checkRevision(state: EditorState, revision: unknown): void {
  if (revision !== state.revision)
    throw new EditorError(
      409,
      'This view has changed. Refresh and review it again.',
    );
}

export async function commit(
  state: EditorState,
  changes: Changes,
): Promise<number> {
  const revision = await getRedisClient().eval(commitScript, {
    keys,
    arguments: [
      JSON.stringify(state),
      JSON.stringify(changes),
      String(Date.parse(state.today) / 1000),
      String(Date.parse(addDays(state.today, 1)) / 1000),
    ],
  });
  if (!revision)
    throw new EditorError(
      409,
      'The schedule or game date changed. Refresh and review again.',
    );
  return Number(revision);
}

// The global mutation revision also supplies a monotonic queue sequence.
export const nextScore = (state: EditorState): number => state.revision + 1;
export const isAssigned = (state: EditorState, word: string): boolean =>
  Object.entries(state.scheduled).some(
    ([date, value]) => date > state.today && value === word,
  );
