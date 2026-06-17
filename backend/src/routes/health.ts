import express, { Router, Request, Response } from "express";
import { getRedisClient } from "../services/redis";

const router: Router = express.Router();
const WORD_INVENTORY_WARNING_DAYS = 7;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

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
    await redisClient.ping();
    const scheduled = await getScheduledWords(
      today,
      WORD_INVENTORY_WARNING_DAYS + 1,
    );
    const todayWord = scheduled[today];
    const tomorrowWord = scheduled[tomorrow];

    let scheduledDaysAhead = 0;
    for (let i = 1; i <= WORD_INVENTORY_WARNING_DAYS; i++) {
      if (!scheduled[addDays(today, i)]) break;
      scheduledDaysAhead++;
    }

    if (!tomorrowWord) warnings.push("No word scheduled for tomorrow");
    if (scheduledDaysAhead < WORD_INVENTORY_WARNING_DAYS) {
      warnings.push(`Only ${scheduledDaysAhead} future day(s) scheduled`);
    }

    const ok = Boolean(todayWord);
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
