import express, { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from 'redis';
import dotenv from "dotenv";

const router: Router = express.Router();
const wordMap: Map<string, boolean> = readWordList();

dotenv.config();
const REDIS_PORT: number = process.env.REDIS_PORT as unknown as number || 6379;
const REDIS_HOST: string = process.env.REDIS_HOST as string || 'localhost';
const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD as string || '';
const redisClient = getRedisClient();

// Default values - should be overwritten on init
let wordLength: number = 5;
let answer: string = 'хамаг';

router.get("/init", async (req: Request, res: Response) => {
  if (redisClient.isReady) {
    const utcTimeStamp = new Date().toISOString();
    const word = await redisClient.get(utcTimeStamp.slice(0,10));

    if (!word) {
      console.log(`Failed to retrieve word from Redis ${utcTimeStamp}`);
    }

    answer = word ?? answer;
    wordLength = answer.length;
    res.json({ wordLength });
  } else {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/wordBank", (req: Request, res: Response) => {
  const wordBank: Array<string> = Array.from(wordMap.keys());
  res.json({ wordBank });
});

router.post("/checkGuess", (req: Request, res: Response) => {
  const { guess } = req.body as GuessWordRequest;
  if (!guess) {
    res.status(400).json({ message: "Bad guess property" });
    return;
  }

  if (!wordMap.has(guess.toLowerCase())) {
    res.status(400).json({ message: "Word not in word bank" });
    return;
  }

  const result = getGuessResult(guess.toLowerCase(), answer);
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

interface GuessWordRequest {
  guess: string;
}

export default router;
