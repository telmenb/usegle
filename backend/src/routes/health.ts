import { addDays, getToday, coverage } from '../services/game-date';
import express, { Router, Request, Response } from "express";
import { getRedisClient } from "../services/redis";

const router: Router = express.Router();
const WORD_INVENTORY_WARNING_DAYS = 7;
const REDIS_HEALTH_TIMEOUT_MS = 3_000;

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

async function getScheduledWords(
  startDate: string,
  days: number,
): Promise<Record<string, string | null>> {
  const redisClient = getRedisClient();
  const dates = Array.from({ length: days }, (_, i) => addDays(startDate, i));
  const values = await redisClient.mGet(dates);

  return dates.reduce<Record<string, string | null>>(
    (scheduled, date, index) => {
      scheduled[date] = values[index];
      return scheduled;
    },
    {},
  );
}

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get("/game", async (req: Request, res: Response) => {
  const redisClient = getRedisClient();
  const today = getToday();
  const tomorrow = addDays(today, 1);
  const warnings: string[] = [];

  if (!redisClient.isReady) {
    res.status(503).json({
      ok: false,
      redis: { ready: false },
      today: { date: today, hasWord: false },
      tomorrow: { date: tomorrow, hasWord: false },
      warnings: ["Redis is not ready"],
    });
    return;
  }

  try {
    // Bound the probe even if Redis is connected but stops responding.
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scheduled = await Promise.race([
      getScheduledWords(today, WORD_INVENTORY_WARNING_DAYS + 1),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Redis health check timed out")),
          REDIS_HEALTH_TIMEOUT_MS,
        );
      }),
    ]).finally(() => clearTimeout(timeout));
    const todayWord = scheduled[today];
    const tomorrowWord = scheduled[tomorrow];

    const scheduledDaysAhead = coverage(today, scheduled, WORD_INVENTORY_WARNING_DAYS).futureScheduledDays;

    if (!todayWord) warnings.push("No word scheduled for today");
    if (!tomorrowWord) warnings.push("No word scheduled for tomorrow");
    if (scheduledDaysAhead < WORD_INVENTORY_WARNING_DAYS) {
      warnings.push(`Only ${scheduledDaysAhead} future day(s) scheduled`);
    }

    const ok = Boolean(todayWord && tomorrowWord);
    res.status(ok ? 200 : 503).json({
      ok,
      redis: { ready: true },
      today: {
        date: today,
        hasWord: Boolean(todayWord),
        wordLength: todayWord?.length ?? null,
      },
      tomorrow: {
        date: tomorrow,
        hasWord: Boolean(tomorrowWord),
        wordLength: tomorrowWord?.length ?? null,
      },
      scheduledDaysAhead,
      warningThresholdDays: WORD_INVENTORY_WARNING_DAYS,
      warnings,
    });
  } catch {
    res.status(503).json({
      ok: false,
      redis: { ready: false },
      today: { date: today, hasWord: false },
      tomorrow: { date: tomorrow, hasWord: false },
      warnings: ["Redis health check failed"],
    });
  }
});

export default router;
