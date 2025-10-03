import express, { Router, Request, Response } from 'express';
import { GuessWordRequest } from '../models/GuessWordRequest';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from 'redis';
import dotenv from "dotenv";
import { isWordInDictionary } from '../services/dictionary-service';

const router: Router = express.Router();
const wordMap: Map<string, boolean> = readWordList();

dotenv.config();
const REDIS_PORT: number = process.env.REDIS_PORT as unknown as number || 6379;
const REDIS_HOST: string = process.env.REDIS_HOST as string || 'localhost';
const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD as string || '';
const redisClient = getRedisClient();

// Default values - should be overwritten on init
let wordLength: number = 5;
let cachedDate: string = '';
let cachedAnswer: string = 'хамаг';

router.get("/init", async (req: Request, res: Response) => {
  if (!redisClient.isReady) {
    res.status(500).json({ errorMessage: 'Internal database error' });
    return;
  }

  const currentDate = new Date().toISOString().slice(0,10);
  if (currentDate !== cachedDate) {
    const word = await redisClient.get(currentDate);
    if (!word) {
      console.log(`Failed to retrieve word from Redis ${currentDate}`);
    }
    cachedDate = word ? currentDate : cachedDate;
    cachedAnswer = word ?? cachedAnswer;
  }

  wordLength = cachedAnswer.length;
  res.json({ wordLength });
});

router.get("/wordBank", (req: Request, res: Response) => {
  const wordBank: Array<string> = Array.from(wordMap.keys());
  res.json({ wordBank });
});

router.post("/checkGuess", async (req: Request, res: Response) => {
  const { guess } = req.body as GuessWordRequest;
  if (!guess) {
    res.status(400).json({ errorMessage: "Bad guess property" });
    return;
  }

  if (!await isWordInDictionary(guess)) {
    res.status(404).json({ errorMessage: "Word not found in dictionary" });
    return;
  }

  const result = getGuessResult(guess.toLowerCase(), cachedAnswer);
  res.json({ result });
})

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

function readWordList(): Map<string, boolean> {
  const wordMap = new Map<string, boolean>();

  try {
    const filePath = path.join(__dirname, '../../data/mongolian_words_5_letters.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const words = content.split('\n');

    for (const word of words) {
      if (word.trim()) {
        wordMap.set(word.trim(), true);
      }
    }
  } catch (error) {
    console.error('Error reading word list:', error);
  }

  return wordMap;
}

function getRedisClient() {
  const client = createClient({
    password: REDIS_PASSWORD,
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
    }
  });
  client.on('connect', () => console.log('Redis Client Connected'));
  client.on('error', err => console.log('Redis Client Error', err));
  client.connect();
  return client;
}

export default router;
