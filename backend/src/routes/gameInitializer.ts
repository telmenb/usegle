import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();
const WORD_LENGTH = 5;

router.get("/", (req: Request, res: Response) => {
  res.json({ wordLength: WORD_LENGTH });
});

export default router;
