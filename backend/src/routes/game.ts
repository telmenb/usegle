import express, { Router, Request, Response } from 'express';
import { GuessWordRequest } from '../models/GuessWordRequest';
import { isWordInDictionary, getFiveLetterWords } from '../services/dictionary-service';
import { getRedisClient } from '../services/redis';

const CACHE_REFRESH_INTERVAL = 60_000;
const router: Router = express.Router();
const redisClient = getRedisClient();

let wordLength: number = 5;
let cachedDate: string = '';
let cachedAnswer: string = '';

async function ensureTodaysWord(): Promise<boolean> {
  if (!redisClient.isReady) return false;

  const currentDate = new Date().toISOString().slice(0, 10);
  if (currentDate === cachedDate) return true;

  const word = await redisClient.get(currentDate);
  if (!word) {
    console.error(`No word scheduled in Redis for ${currentDate}`);
    return false;
  }
  cachedDate = currentDate;
  cachedAnswer = word;
  wordLength = word.length;
  return true;
}

// Warm cache on startup and refresh it every 60 seconds
(async () => {
  try { await ensureTodaysWord(); } catch (e) { console.error('Startup cache warm-up failed:', e); }
})();

setInterval(async () => {
  try { await ensureTodaysWord(); } catch (e) { console.error('Cache refresh failed:', e); }
}, CACHE_REFRESH_INTERVAL);

router.get("/init", async (req: Request, res: Response) => {
  if (!redisClient.isReady) {
    res.status(500).json({ errorMessage: 'Internal database error' });
    return;
  }

  if (!await ensureTodaysWord()) {
    res.status(503).json({ errorMessage: 'No word scheduled for today' });
    return;
  }

  res.json({ wordLength });
});

router.get("/health", (req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const healthy = cachedDate === today;
  res.status(healthy ? 200 : 503).json({ healthy, cachedDate, wordLength });
});

router.get("/wordBank", (req: Request, res: Response) => {
  res.json({ wordBank: getFiveLetterWords() });
});

router.post("/checkGuess", async (req: Request, res: Response) => {
  const { guess } = req.body as GuessWordRequest;
  if (!guess) {
    res.status(400).json({ errorMessage: "Bad guess property" });
    return;
  }

  if (!await ensureTodaysWord()) {
    res.status(503).json({ errorMessage: 'No word scheduled for today' });
    return;
  }

  if (!isWordInDictionary(guess)) {
    res.status(404).json({ errorMessage: "Word not found in dictionary" });
    return;
  }

  const result = getGuessResult(guess.toLowerCase(), cachedAnswer);
  res.json({ result });
});

function getGuessResult(guess: string, answer: string): Array<number> {
  const letterCount: any = {};
  const result: Array<number> = new Array(wordLength).fill(-1);
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) result[i] = 1;
    else letterCount[answer[i]] = (letterCount[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i] || !letterCount[guess[i]]) continue;
    letterCount[guess[i]]--;
    result[i] = 0;
  }
  return result;
}

export default router;
