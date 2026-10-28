import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { createHash, scryptSync } from 'node:crypto';
import { getRedisClient } from '../services/redis';
import { addDays, coverage, getToday, isGameDate } from '../services/game-date';
import {
  getFiveLetterWords,
  isEditorWord,
  isWordInDictionary,
} from '../services/dictionary-service';
import { candidates, decide, undoDecision } from '../services/editor/review';
import {
  previewSchedule,
  saveSchedule,
  summary,
} from '../services/editor/schedule';
import { commit, readState } from '../services/editor/store';
import { checkSession, login, logout } from '../services/editor/session';
import express from 'express';
import adminRoutes from '../routes/admin';
import { requireAdminKey } from '../middleware/auth';
import type { Server } from 'node:http';

let redisProcess: ChildProcess;
let isolatedPort: number;
let server: Server;
let base: string;
const words = getFiveLetterWords().filter(isEditorWord).slice(0, 50);
const redis = () => getRedisClient();
const tomorrow = () => addDays(getToday(), 1);
const rejected = (promise: Promise<unknown>, status: number) =>
  assert.rejects(promise, (err: any) => err.status === status);

before(async () => {
  const port = await new Promise<number>((resolve) => {
    const socket = createServer();
    socket.listen(0, '127.0.0.1', () => {
      const address = socket.address() as { port: number };
      socket.close(() => resolve(address.port));
    });
  });
  isolatedPort = port;
  process.env.REDIS_HOST = '127.0.0.1';
  process.env.REDIS_PORT = String(port);
  process.env.REDIS_PASSWORD = '';
  process.env.REDIS_USER = '';
  process.env.EDITOR_TRUST_CLIENT_IP = 'false';
  process.env.ADMIN_API_KEY = 'integration-only-key';
  process.env.EDITOR_ORIGIN = 'https://editor.test';
  const salt = 'ab'.repeat(16);
  process.env.EDITOR_PASSWORD_HASH = `${salt}:${scryptSync('test-password', salt, 64).toString('hex')}`;
  redisProcess = spawn(
    'redis-server',
    [
      '--bind',
      '127.0.0.1',
      '--port',
      String(port),
      '--save',
      '',
      '--appendonly',
      'no',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  await new Promise<void>((resolve, reject) => {
    redisProcess.on('error', reject);
    redisProcess.stdout?.on('data', (data) => {
      if (String(data).includes('Ready to accept connections')) resolve();
    });
    redisProcess.on('exit', (code) => {
      if (code) reject(new Error('Test Redis failed to start'));
    });
  });
  const client = redis();
  assertIsolated();
  assert.notEqual(port, 6379);
  if (!client.isReady)
    await new Promise<void>((resolve) => client.once('ready', resolve));
  const app = express();
  app.use(express.json());
  app.use('/api/admin', requireAdminKey, adminRoutes);
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/admin`;
});
after(async () => {
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  if (redis().isOpen) await redis().quit();
  redisProcess?.kill();
});
function assertIsolated() {
  const socket = redis().options?.socket;
  assert.ok(socket && 'host' in socket && 'port' in socket);
  assert.equal(socket.host, '127.0.0.1');
  assert.equal(socket.port, isolatedPort);
  assert.equal(redis().options?.password, undefined);
}
async function reset() {
  assertIsolated();
  await redis().flushDb();
}
async function approve(word: string) {
  return decide(word, 'approved', (await readState()).revision);
}

// All tests share only this disposable Redis process and run serially.
test('canonical dictionary, exact dates and consecutive coverage', () => {
  assert.ok(isWordInDictionary(words[0].toUpperCase()));
  assert.ok(isEditorWord(words[0]));
  assert.equal(isEditorWord('abcde'), false);
  assert.equal(isGameDate('2026-02-30'), false);
  assert.equal(isGameDate('2028-02-29'), true);
  const today = getToday();
  assert.equal(
    coverage(today, { [addDays(today, 2)]: 'word' }).futureScheduledDays,
    0,
  );
});

test('decisions persist, approval is idempotent, review excludes both pools and undo is guarded', async () => {
  await reset();
  const first = await approve(words[0]);
  await approve(words[0]);
  assert.equal((await readState()).queue.length, 1);
  await rejected(undoDecision(first.undo), 409);
  const rejection = await decide(
    words[1],
    'rejected',
    (await readState()).revision,
  );
  const page = await candidates('session', 0, words[1]);
  assert.equal(page.total, 0);
  await undoDecision(rejection.undo);
  assert.equal((await candidates('session', 0, words[1])).total, 1);
  await rejected(
    decide('abcde', 'approved', (await readState()).revision),
    400,
  );
});

test('approval checks future assignments but does not infer decisions from legacy past use', async () => {
  await reset();
  await redis().set(addDays(getToday(), -1), words[0]);
  assert.equal((await candidates('session', 0, words[0])).total, 1);
  await redis().set(tomorrow(), words[0]);
  await approve(words[0]);
  assert.equal((await readState()).queue.length, 0);
  assert.equal((await readState()).decisions[words[0]], 'approved');
});

test('gap fill previews shortages, preserves existing dates and requires explicit save', async () => {
  await reset();
  await redis().set(addDays(getToday(), 2), words[10]);
  await approve(words[0]);
  await approve(words[1]);
  const preview = await previewSchedule();
  assert.deepEqual(
    preview.assignments.map((row) => row.date),
    [tomorrow(), addDays(getToday(), 3)],
  );
  assert.equal(preview.shortage, 27);
  assert.equal(await redis().get(tomorrow()), null);
  await saveSchedule(preview);
  assert.equal(await redis().get(addDays(getToday(), 2)), words[10]);
  assert.equal((await summary()).futureScheduledDays, 3);
  assert.equal((await readState()).queue.length, 0);
  assert.equal((await candidates('same', 0, words[0])).total, 0);
  await rejected(saveSchedule(preview), 409);
});

test('a reviewed batch fills exactly 30 future days and leaves remaining inventory queued', async () => {
  await reset();
  for (const word of words.slice(0, 32)) await approve(word);
  const preview = await previewSchedule();
  assert.equal(preview.assignments.length, 30);
  assert.equal(preview.shortage, 0);
  await saveSchedule(preview);
  assert.equal((await summary()).futureScheduledDays, 30);
  assert.equal((await readState()).queue.length, 2);
  assert.equal(await redis().get(getToday()), null);
});

test('simultaneous saves cannot double-consume or overwrite a batch', async () => {
  await reset();
  for (const word of words.slice(0, 3)) await approve(word);
  const preview = await previewSchedule();
  const results = await Promise.allSettled([
    saveSchedule(preview),
    saveSchedule(preview),
  ]);
  assert.equal(
    results.filter((result) => result.status === 'fulfilled').length,
    1,
  );
  for (const row of preview.assignments)
    assert.equal(await redis().get(row.date), row.word);
  assert.equal((await readState()).queue.length, 0);
});

test('validation failure, UTC rollover and out-of-band Redis edits leave no partial writes', async () => {
  await reset();
  await approve(words[0]);
  await approve(words[1]);
  let preview = await previewSchedule();
  const invalid = structuredClone(preview);
  invalid.assignments[1].word = invalid.assignments[0].word;
  await rejected(saveSchedule(invalid), 400);
  assert.equal(await redis().get(tomorrow()), null);
  await rejected(
    saveSchedule({ ...preview, today: addDays(getToday(), -1) }),
    409,
  );
  await redis().set(preview.assignments[1].date, words[10]);
  await rejected(saveSchedule(preview), 409);
  assert.equal(await redis().get(tomorrow()), null);
  // Inject a write after validation but before the commit boundary.
  const state = await readState();
  await redis().set(addDays(getToday(), 50), words[20]);
  await rejected(
    commit(state, { assignments: [{ date: tomorrow(), word: words[0] }] }),
    409,
  );
  assert.equal(await redis().get(tomorrow()), null);
  preview = await previewSchedule();
  await redis().set(addDays(getToday(), 60), words[0]);
  await rejected(saveSchedule(preview), 400);
});

test('replacement returns only approved displaced words and concurrent replacements conflict', async () => {
  await reset();
  await approve(words[0]);
  await saveSchedule(await previewSchedule());
  await approve(words[1]);
  await approve(words[2]);
  const preview = await previewSchedule(tomorrow());
  const results = await Promise.allSettled([
    saveSchedule(preview),
    saveSchedule(preview),
  ]);
  assert.equal(
    results.filter((result) => result.status === 'fulfilled').length,
    1,
  );
  const state = await readState();
  assert.equal(state.scheduled[tomorrow()], words[1]);
  assert.ok(state.queue.some((item) => item.word === words[0]));
  assert.ok(!state.queue.some((item) => item.word === words[1]));
  await redis().set(addDays(getToday(), 5), words[10]);
  await saveSchedule(await previewSchedule(addDays(getToday(), 5)));
  assert.ok(!(await readState()).queue.some((item) => item.word === words[10]));
  await rejected(previewSchedule(getToday()), 400);
});

test('move/reject/undo restore exact queue state and scheduled approvals do not reappear', async () => {
  await reset();
  await approve(words[0]);
  await approve(words[1]);
  const initial = (await readState()).queue;
  const top = await decide(
    words[1],
    'approved',
    (await readState()).revision,
    true,
  );
  assert.equal((await readState()).queue[0].word, words[1]);
  await undoDecision(top.undo);
  assert.deepEqual((await readState()).queue, initial);
  const rejection = await decide(
    words[0],
    'rejected',
    (await readState()).revision,
  );
  assert.ok(!(await readState()).queue.some((item) => item.word === words[0]));
  await undoDecision(rejection.undo);
  assert.deepEqual((await readState()).queue, initial);
});

test('sessions are hashed, expire, revoke on logout and password rotation; login throttles', async () => {
  await reset();
  await rejected(login('wrong', 'a'), 401);
  const session = await login('test-password', 'a');
  await checkSession(session.token);
  assert.equal((await redis().keys(`*${session.token}*`)).length, 0);
  await logout(session.token);
  await rejected(checkSession(session.token), 401);
  const second = await login('test-password', 'a');
  const configured = process.env.EDITOR_PASSWORD_HASH;
  process.env.EDITOR_PASSWORD_HASH = `${'cd'.repeat(16)}:${'ab'.repeat(64)}`;
  await rejected(checkSession(second.token), 401);
  process.env.EDITOR_PASSWORD_HASH = configured;
  const third = await login('test-password', 'b');
  const key = `editor:session:${createHash('sha256').update(third.token).digest('hex')}`;
  const stored = JSON.parse((await redis().get(key))!);
  stored.expires = Date.now() - 1;
  await redis().set(key, JSON.stringify(stored));
  await rejected(checkSession(third.token), 401);
  for (let i = 0; i < 5; i++) await rejected(login('wrong', 'blocked'), 401);
  await rejected(login('test-password', 'blocked'), 429);
});

test('private endpoints require both credentials and trusted mutation origin; all responses are no-store', async () => {
  await reset();
  const headers = {
    Authorization: 'Bearer integration-only-key',
    Origin: 'https://editor.test',
    'Content-Type': 'application/json',
  };
  let response = await fetch(`${base}/summary`);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  response = await fetch(`${base}/summary`, { headers });
  assert.equal(response.status, 401);
  response = await fetch(`${base}/session/login`, {
    method: 'POST',
    headers: { ...headers, Origin: 'https://evil.test' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  assert.equal(response.status, 403);
  response = await fetch(`${base}/session/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ password: 'test-password' }),
  });
  const { token } = (await response.json()) as { token: string };
  response = await fetch(`${base}/summary`, {
    headers: { ...headers, Cookie: `__Host-usegle-editor=${token}` },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  response = await fetch(`${base}/words`, {
    method: 'POST',
    headers: { ...headers, Cookie: `__Host-usegle-editor=${token}` },
    body: JSON.stringify({ words }),
  });
  assert.equal(response.status, 404);
});
