import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();
const ANSWER: string = 'хамаг';

router.post("/", (req: Request, res: Response) => {
  const { guess } = req.body as GuessWordRequest;
  if (!guess) {
    res.status(400).json({ message: "Bad guess property" });
    return;
  }

  let result: Array<number> = [];
  for (let i = 0; i < guess.length; i++) {
    const char = guess[i].toLowerCase();
    if (char === ANSWER[i]) {
      result.push(1);
    } else if (ANSWER.includes(char)) {
      result.push(0);
    } else {
      result.push(-1);
    }
  };
  res.json({ result });
})

function shouldMarkPartial(idx: number, guess: string, answer: string): boolean {
  // TODO: Only mark partial if there are more guess[idx] in answer
  // If guess[idx] is guess's 4th 'e' but answer has only 3 'e's, don't mark partial
  return false;
}

interface GuessWordRequest {
  guess: string;
}

export default router;
