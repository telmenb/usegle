import * as fs from 'fs';
import * as path from 'path';

export interface DictionaryWord {
  word: string;
  meanings: { pos: string; meaning: string }[];
}

export const normalizeWord = (word: string): string =>
  word.trim().toLowerCase().normalize('NFC');
const dictionary = new Map<string, DictionaryWord>();

function loadDictionary(): void {
  const lines = fs
    .readFileSync(path.join(__dirname, '../../data/toli_words.jsonl'), 'utf8')
    .split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (typeof entry.word !== 'string') continue;
      const word = normalizeWord(entry.word);
      if (word.length !== 5) continue;
      const item = dictionary.get(word) ?? { word, meanings: [] };
      const meaning = typeof entry.meaning === 'string' ? entry.meaning : '';
      const pos = typeof entry.pos === 'string' ? entry.pos : '';
      if (!item.meanings.some((m) => m.meaning === meaning && m.pos === pos))
        item.meanings.push({ pos, meaning });
      dictionary.set(word, item);
    } catch {
      /* Ignore malformed source records. */
    }
  }
}
loadDictionary();

export const isWordInDictionary = (word: string): boolean =>
  dictionary.has(normalizeWord(word));
export const getFiveLetterWords = (): string[] => Array.from(dictionary.keys());
export const getDictionaryWord = (word: string): DictionaryWord | undefined =>
  dictionary.get(word);
export const isEditorWord = (word: string): boolean =>
  /^[а-яөүё]{5}$/.test(word) && dictionary.has(word);
