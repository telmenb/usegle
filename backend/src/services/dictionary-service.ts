import * as fs from 'fs';
import * as path from 'path';

const wordSet = new Set<string>();

function loadDictionary(): void {
  const filePath = path.join(__dirname, '../../data/toli_words.jsonl');
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const { word } = JSON.parse(line);
      if (typeof word === 'string' && word.trim().length === 5) {
        wordSet.add(word.trim().toLowerCase());
      }
    } catch {
      // skip malformed lines
    }
  }
  console.log(`Dictionary loaded: ${wordSet.size} five-letter words`);
}

loadDictionary();

export function isWordInDictionary(word: string): boolean {
  return wordSet.has(word.trim().toLowerCase());
}

export function getFiveLetterWords(): string[] {
  return Array.from(wordSet);
}
