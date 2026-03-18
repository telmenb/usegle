import axios from 'axios';
import { DictionaryEntry } from '../models/DictionaryEntry';

const DICTIONARY_API_HOST = "https://toli.gov.mn";

const dictionaryCache = new Map<string, boolean>();

export async function isWordInDictionary(word: string): Promise<boolean> {
  const key = word.toLowerCase();
  if (dictionaryCache.has(key)) return dictionaryCache.get(key)!;

  const dictionaryEntries = await searchDictionary(word);
  const found = dictionaryEntries.length > 0 &&
    !!dictionaryEntries.find((entry: DictionaryEntry) => entry.value.toLowerCase() === key);

  dictionaryCache.set(key, found);
  return found;
}

async function searchDictionary(word: string): Promise<DictionaryEntry[]> {
  if (typeof word !== 'string' || word.trim().length < 3) {
    return [];
  }

  const response = await axios.get(`${DICTIONARY_API_HOST}/auto`, {
    params: {
      term: word
    }
  });

  try {
    return response.data as DictionaryEntry[];
  } catch (error) {
    console.error('Error parsing dictionary response:', error);
    return [];
  }
}
