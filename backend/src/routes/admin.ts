import express, { Router, Request, Response } from 'express';
import { getRedisClient } from '../services/redis';

const router: Router = express.Router();

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// Adds `days` days to a YYYY-MM-DD string
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Scans Redis for all date-keyed words and returns the latest date string, or null
async function getLatestScheduledDate(): Promise<string | null> {
  const redisClient = getRedisClient();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  let cursor = 0;
  let latestDate: string | null = null;

  do {
    const reply = await redisClient.scan(cursor, { MATCH: '????-??-??', COUNT: 100 });
    cursor = reply.cursor;
    for (const key of reply.keys) {
      if (datePattern.test(key)) {
        if (!latestDate || key > latestDate) {
          latestDate = key;
        }
      }
    }
  } while (cursor !== 0);

  return latestDate;
}

// POST /api/admin/words
// Body: { words: string[], startDate?: string (YYYY-MM-DD) }
// Assigns each word to consecutive days starting from startDate (inclusive),
// or after the latest scheduled date if startDate is omitted
router.post('/words', async (req: Request, res: Response) => {
  const redisClient = getRedisClient();

  if (!redisClient.isReady) {
    res.status(500).json({ errorMessage: 'Internal database error' });
    return;
  }

  const { words, startDate } = req.body as { words: unknown; startDate?: unknown };

  if (!Array.isArray(words) || words.length === 0) {
    res.status(400).json({ errorMessage: 'Body must contain a non-empty "words" array' });
    return;
  }

  const invalidWords = words.filter((w) => typeof w !== 'string' || w.trim() === '');
  if (invalidWords.length > 0) {
    res.status(400).json({ errorMessage: 'All words must be non-empty strings' });
    return;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (startDate !== undefined && (typeof startDate !== 'string' || !datePattern.test(startDate))) {
    res.status(400).json({ errorMessage: 'Invalid "startDate" format, expected YYYY-MM-DD' });
    return;
  }

  const trimmedWords = (words as string[]).map((w) => w.trim().toLowerCase());

  let startFrom: string;
  if (startDate) {
    startFrom = startDate;
  } else {
    const latestDate = await getLatestScheduledDate();
    startFrom = addDays(getToday(), 1);
    if (latestDate && latestDate > getToday()) {
      startFrom = addDays(latestDate, 1);
    }
  }

  const scheduled: Record<string, string> = {};
  const pipeline = redisClient.multi();

  for (let i = 0; i < trimmedWords.length; i++) {
    const date = addDays(startFrom, i);
    scheduled[date] = trimmedWords[i];
    pipeline.set(date, trimmedWords[i]);
  }

  await pipeline.exec();

  res.json({ scheduled });
});

// GET /api/admin/words?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns all scheduled words, optionally filtered by date range
router.get('/words', async (req: Request, res: Response) => {
  const redisClient = getRedisClient();

  if (!redisClient.isReady) {
    res.status(500).json({ errorMessage: 'Internal database error' });
    return;
  }

  const { from, to } = req.query as { from?: string; to?: string };
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (from && !datePattern.test(from)) {
    res.status(400).json({ errorMessage: 'Invalid "from" date format, expected YYYY-MM-DD' });
    return;
  }
  if (to && !datePattern.test(to)) {
    res.status(400).json({ errorMessage: 'Invalid "to" date format, expected YYYY-MM-DD' });
    return;
  }

  let cursor = 0;
  const dateKeys: string[] = [];

  do {
    const reply = await redisClient.scan(cursor, { MATCH: '????-??-??', COUNT: 100 });
    cursor = reply.cursor;
    for (const key of reply.keys) {
      if (datePattern.test(key)) {
        if (from && key < from) continue;
        if (to && key > to) continue;
        dateKeys.push(key);
      }
    }
  } while (cursor !== 0);

  dateKeys.sort();

  const scheduled: Record<string, string> = {};
  if (dateKeys.length > 0) {
    const values = await redisClient.mGet(dateKeys);
    for (let i = 0; i < dateKeys.length; i++) {
      if (values[i] !== null) {
        scheduled[dateKeys[i]] = values[i] as string;
      }
    }
  }

  res.json({ scheduled });
});

// DELETE /api/admin/words/:date
router.delete('/words/:date', async (req: Request, res: Response) => {
  const redisClient = getRedisClient();

  if (!redisClient.isReady) {
    res.status(500).json({ errorMessage: 'Internal database error' });
    return;
  }

  const { date } = req.params;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(date)) {
    res.status(400).json({ errorMessage: 'Invalid date format, expected YYYY-MM-DD' });
    return;
  }

  const deleted = await redisClient.del(date);
  if (deleted === 0) {
    res.status(404).json({ errorMessage: `No word scheduled for ${date}` });
    return;
  }

  res.json({ deleted: date });
});

export default router;
