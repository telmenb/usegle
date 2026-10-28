import { createHash, randomBytes } from 'crypto';
import {
  getDictionaryWord,
  getFiveLetterWords,
  isEditorWord,
  normalizeWord,
} from '../dictionary-service';
import { getRedisClient } from '../redis';
import {
  checkRevision,
  commit,
  Decision,
  EditorError,
  isAssigned,
  nextScore,
  readState,
  requireValue,
} from './store';

export async function candidates(seed: string, offset: number, search: string) {
  const state = await readState();
  const words = getFiveLetterWords().filter(
    (word) =>
      isEditorWord(word) &&
      !state.decisions[word] &&
      (!search || word === normalizeWord(search)),
  );
  words.sort((a, b) =>
    createHash('sha256')
      .update(seed + a)
      .digest('hex')
      .localeCompare(
        createHash('sha256')
          .update(seed + b)
          .digest('hex'),
      ),
  );
  return {
    revision: state.revision,
    total: words.length,
    candidates: words
      .slice(offset, offset + 20)
      .map((word) => getDictionaryWord(word)),
  };
}

export async function getQueue(search = '', offset = 0) {
  const state = await readState();
  const queue = state.queue.filter(
    (item) => !search || item.word.includes(normalizeWord(search)),
  );
  return {
    revision: state.revision,
    total: queue.length,
    words: queue
      .slice(offset, offset + 50)
      .map((item) => getDictionaryWord(item.word)),
  };
}

export async function decide(
  wordInput: unknown,
  decision: unknown,
  revision: unknown,
  move = false,
) {
  requireValue(typeof wordInput === 'string', 'A word is required.');
  const word = normalizeWord(wordInput);
  requireValue(
    isEditorWord(word),
    'Choose a five-letter Mongolian dictionary word.',
  );
  requireValue(
    decision === 'approved' || decision === 'rejected',
    'Invalid decision.',
  );
  const state = await readState();
  checkRevision(state, revision);
  const previous = state.decisions[word] ?? null;
  const score = state.queue.find((item) => item.word === word)?.score ?? null;
  if (move) requireValue(score !== null, 'This word is no longer queued.');
  const newScore =
    decision === 'approved' && !isAssigned(state, word)
      ? move
        ? -nextScore(state)
        : (score ?? nextScore(state))
      : null;
  const newRevision = await commit(state, {
    decisions: [{ word, decision: decision as Decision }],
    queue: [{ word, score: newScore }],
  });
  const undo = randomBytes(24).toString('hex');
  await getRedisClient().set(
    `editor:undo:${undo}`,
    JSON.stringify({
      word,
      decision: previous,
      score,
      revision: newRevision,
      today: state.today,
    }),
    { EX: 600 },
  );
  return { revision: newRevision, undo };
}

export async function undoDecision(token: unknown) {
  requireValue(
    typeof token === 'string' && /^[a-f0-9]{48}$/.test(token),
    'Invalid undo.',
  );
  const value = await getRedisClient().get(`editor:undo:${token}`);
  if (!value) throw new EditorError(409, 'Undo expired.');
  const previous = JSON.parse(value);
  const state = await readState();
  checkRevision(state, previous.revision);
  if (state.today !== previous.today)
    throw new EditorError(
      409,
      'The game date changed. Undo is no longer available.',
    );
  const revision = await commit(state, {
    decisions: [{ word: previous.word, decision: previous.decision }],
    queue: [{ word: previous.word, score: previous.score }],
  });
  await getRedisClient().del(`editor:undo:${token}`);
  return { revision };
}
