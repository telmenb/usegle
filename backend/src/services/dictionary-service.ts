import axios from 'axios';
import { DictionaryEntry } from '../models/DictionaryEntry';

const DICTIONARY_API_HOST = "https://toli.gov.mn";

export async function isWordInDictionary(word: string): Promise<boolean> {
  const dictionaryEntries = await searchDictionary(word);
  return !!(dictionaryEntries.length > 0 &&
         dictionaryEntries.find((entry: DictionaryEntry) => entry.value.toLowerCase() === word.toLowerCase()));
}

async function searchDictionary(word: string): Promise<DictionaryEntry[]> {
  const response = await axios.get(`${DICTIONARY_API_HOST}/auto`, {
    params: {
      term: word
    }
  });

  return response.data as DictionaryEntry[];
}
