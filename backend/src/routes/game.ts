import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();
const WORD_LENGTH = 5;
const ANSWER: string = 'хамаг';

router.get("/init", (req: Request, res: Response) => {
  res.json({ wordLength: WORD_LENGTH });
});

router.post("/checkGuess", (req: Request, res: Response) => {
  const { guess } = req.body as GuessWordRequest;
  if (!guess) {
    res.status(400).json({ message: "Bad guess property" });
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

interface GuessWordRequest {
  guess: string;
}

export default router;
