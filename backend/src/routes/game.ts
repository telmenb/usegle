import express, { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router: Router = express.Router();
const WORD_LENGTH = 5;
const ANSWER: string = 'хамаг';
const wordMap: Map<string, boolean> = readWordList();

router.get("/init", (req: Request, res: Response) => {
  res.json({ wordLength: WORD_LENGTH });
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

  const result = getGuessResult(guess.toLowerCase(), ANSWER);
  res.json({ result });
})

function getGuessResult(guess: string, answer: string): Array<number> {
  const letterCount: any = {};
  const result: Array<number> = new Array(WORD_LENGTH).fill(-1);
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

interface GuessWordRequest {
  guess: string;
}

export default router;
