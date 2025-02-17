import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

const ANSWER: string = "хамаг";
const WORD_LENGTH = ANSWER.length;

// Enable CORS
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use((req: Request, res: Response, next) => {
  console.log(req.method, req.path);
  next();
})

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/api/init", (req: Request, res: Response) => {
  res.json({ wordLength: WORD_LENGTH });
});

app.post("/api/guessWord", (req: Request, res: Response) => {
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

interface GuessWordRequest {
  guess: string;
}

function shouldMarkPartial(idx: number, guess: string, answer: string): boolean {
  // Only mark partial if there are more guess[idx] in answer
  // If guess[idx] is guess's 4th 'e' but answer has only 3 'e's, don't mark partial
  return false;
}

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
