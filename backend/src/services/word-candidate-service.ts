import fs from 'fs';
import path from 'path';

export interface WordCandidate {
  word: string;
  score: number;
  entryCount: number;
  posTags: string[];
  meanings: string[];
}

export interface CandidateStats {
  loadedEntries: number;
  uniqueFiveLetterWords: number;
  eligibleWords: number;
}

interface ToliEntry {
  word?: unknown;
  pos?: unknown;
  meaning?: unknown;
}

const MONGOLIAN_FIVE_LETTER_WORD = /^[а-яөүё]{5}$/i;
const BAD_POS_MARKERS = ['а.ө', 'баймж', 'холб', 'сул', 'даг', 'товч', 'угт', 'төл'];
const GOOD_POS_SCORES: Array<[string, number]> = [
  ['ж.н', 30],
  ['үйл', 22],
  ['тэм', 18],
  ['дай', 10],
];
const OBSCURE_MARKERS = ['хуучир', 'нутг', 'аялгуу', 'товч', 'шашин', 'домог', 'тусгай', 'анагаах'];

function dataPath(): string {
  const candidates = [
    path.join(process.cwd(), 'data/toli_words.jsonl'),
    path.join(process.cwd(), 'backend/data/toli_words.jsonl'),
    path.join(__dirname, '../../data/toli_words.jsonl'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('Could not find backend/data/toli_words.jsonl');
  return found;
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function scoreCandidate(word: string, entries: Array<{ pos: string; meaning: string }>): number {
  let score = 20;
  const combinedPos = entries.map((entry) => entry.pos).join(' ');
  const combinedMeaning = entries.map((entry) => entry.meaning).join(' ');

  if (BAD_POS_MARKERS.some((marker) => combinedPos.includes(marker))) score -= 35;

  const bestPosScore = GOOD_POS_SCORES.reduce((best, [marker, value]) => {
    return combinedPos.includes(marker) ? Math.max(best, value) : best;
  }, 0);
  score += bestPosScore;

  score += Math.min(entries.length * 3, 15);
  score += Math.min(Math.floor(combinedMeaning.length / 20), 12);
  score += new Set(word).size * 3;

  if (combinedMeaning.trim().length < 8) score -= 20;
  if (OBSCURE_MARKERS.some((marker) => combinedMeaning.includes(marker))) score -= 12;
  if (new Set(word).size <= 3) score -= 8;

  return score;
}

let cached: { candidates: WordCandidate[]; stats: CandidateStats } | null = null;

export function loadWordCandidates(): { candidates: WordCandidate[]; stats: CandidateStats } {
  if (cached) return cached;

  const contents = fs.readFileSync(dataPath(), 'utf8');
  const grouped = new Map<string, Array<{ pos: string; meaning: string }>>();
  let loadedEntries = 0;

  for (const line of contents.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as ToliEntry;
      loadedEntries++;
      if (typeof entry.word !== 'string') continue;
      const word = normalizeWord(entry.word);
      if (!MONGOLIAN_FIVE_LETTER_WORD.test(word)) continue;

      const pos = typeof entry.pos === 'string' ? entry.pos : '';
      const meaning = typeof entry.meaning === 'string' ? entry.meaning.trim() : '';
      if (!meaning) continue;

      const existing = grouped.get(word) || [];
      existing.push({ pos, meaning });
      grouped.set(word, existing);
    } catch {
      // Ignore malformed JSONL rows.
    }
  }

  const candidates = Array.from(grouped.entries())
    .map(([word, entries]) => ({
      word,
      score: scoreCandidate(word, entries),
      entryCount: entries.length,
      posTags: Array.from(new Set(entries.map((entry) => entry.pos).filter(Boolean))),
      meanings: entries.map((entry) => entry.meaning),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));

  cached = {
    candidates,
    stats: {
      loadedEntries,
      uniqueFiveLetterWords: grouped.size,
      eligibleWords: candidates.length,
    },
  };

  return cached;
}
