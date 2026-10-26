import { addDays, coverage, isGameDate } from '../game-date';
import { isEditorWord } from '../dictionary-service';
import {
  checkRevision,
  commit,
  EditorError,
  EditorState,
  isAssigned,
  nextScore,
  readState,
  requireValue,
} from './store';

export interface Assignment {
  date: string;
  word: string;
  previous: string | null;
}
export interface Preview {
  today: string;
  revision: number;
  assignments: Assignment[];
  existing: Assignment[];
  shortage: number;
  replacement: boolean;
}

function eligible(state: EditorState, word: string): boolean {
  return (
    isEditorWord(word) &&
    state.decisions[word] === 'approved' &&
    state.queue.some((item) => item.word === word) &&
    !isAssigned(state, word)
  );
}
export async function summary() {
  const state = await readState();
  return {
    ...coverage(state.today, state.scheduled),
    queueCount: state.queue.length,
    revision: state.revision,
  };
}
export async function scheduleRange(from: unknown, days: number) {
  const state = await readState();
  const start = from ?? addDays(state.today, 1);
  requireValue(
    isGameDate(start) &&
      start > state.today &&
      start <= addDays(state.today, 365),
    'Choose a future date within one year.',
  );
  requireValue(
    Number.isInteger(days) && days >= 1 && days <= 30,
    'Load between 1 and 30 days.',
  );
  return {
    today: state.today,
    revision: state.revision,
    rows: Array.from({ length: days }, (_, i) => {
      const date = addDays(start, i);
      return { date, word: state.scheduled[date] ?? null };
    }),
  };
}
export async function previewSchedule(date?: unknown): Promise<Preview> {
  const state = await readState();
  if (date !== undefined)
    requireValue(
      isGameDate(date) &&
        date > state.today &&
        date <= addDays(state.today, 365) &&
        state.scheduled[date],
      'Choose an assigned future date within one year.',
    );
  const dates = date
    ? [date as string]
    : Array.from({ length: 30 }, (_, i) => addDays(state.today, i + 1));
  const available = state.queue.filter((item) => eligible(state, item.word));
  const assignments: Assignment[] = [];
  const existing: Assignment[] = [];
  let gaps = 0;
  for (const day of dates) {
    const previous = state.scheduled[day] ?? null;
    if (previous && !date) {
      existing.push({ date: day, word: previous, previous });
      continue;
    }
    gaps++;
    const item = available.shift();
    if (item) assignments.push({ date: day, word: item.word, previous });
  }
  return {
    today: state.today,
    revision: state.revision,
    assignments,
    existing,
    shortage: gaps - assignments.length,
    replacement: Boolean(date),
  };
}

export async function saveSchedule(input: unknown) {
  requireValue(
    input && typeof input === 'object',
    'A schedule preview is required.',
  );
  const preview = input as Preview;
  const state = await readState();
  checkRevision(state, preview.revision);
  if (state.today !== preview.today)
    throw new EditorError(409, 'The UTC game date changed. Preview again.');
  requireValue(
    typeof preview.replacement === 'boolean' &&
      Array.isArray(preview.assignments) &&
      preview.assignments.length > 0 &&
      preview.assignments.length <= 30,
    'Save between 1 and 30 assignments.',
  );
  if (preview.replacement)
    requireValue(
      preview.assignments.length === 1,
      'Replace only one date at a time.',
    );
  const dates = new Set<string>();
  const words = new Set<string>();
  for (const row of preview.assignments) {
    requireValue(
      row &&
        isGameDate(row.date) &&
        row.date > state.today &&
        row.date <= addDays(state.today, preview.replacement ? 365 : 30),
      'Only future preview dates can be changed.',
    );
    requireValue(
      !dates.has(row.date) && !words.has(row.word),
      'Dates and words must be unique.',
    );
    requireValue(
      typeof row.word === 'string' && eligible(state, row.word),
      'A proposed word is no longer eligible.',
    );
    if ((state.scheduled[row.date] ?? null) !== row.previous)
      throw new EditorError(409, 'An assignment changed. Preview again.');
    requireValue(
      preview.replacement
        ? typeof row.previous === 'string'
        : row.previous === null,
      'Use an explicit replacement preview for assigned dates.',
    );
    dates.add(row.date);
    words.add(row.word);
  }
  const queue: { word: string; score: number | null }[] =
    preview.assignments.map((row) => ({ word: row.word, score: null }));
  const replacement = preview.assignments[0];
  if (
    preview.replacement &&
    replacement.previous &&
    state.decisions[replacement.previous] === 'approved' &&
    !Object.entries(state.scheduled).some(
      ([date, word]) =>
        date > state.today &&
        date !== replacement.date &&
        word === replacement.previous,
    )
  ) {
    queue.push({ word: replacement.previous, score: nextScore(state) });
  }
  const revision = await commit(state, {
    queue,
    assignments: preview.assignments,
  });
  return { revision, saved: preview.assignments.length };
}
