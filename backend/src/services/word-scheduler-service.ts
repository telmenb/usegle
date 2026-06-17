import { RedisClientType } from 'redis';
import { loadWordCandidates, CandidateStats } from './word-candidate-service';

export interface AutofillOptions {
  targetFutureDays?: number;
  lookbackDays?: number;
  minQualityScore?: number;
  dryRun?: boolean;
}

export interface AutofillResult {
  today: string;
  targetFutureDays: number;
  lookbackDays: number;
  minQualityScore: number;
  dryRun: boolean;
  currentlyScheduledFutureDays: number;
  needed: number;
  scheduled: Record<string, string>;
  skippedExistingDates: string[];
  warnings: string[];
  candidateStats: CandidateStats & { usableCandidates: number };
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parsePositiveInteger(value: unknown, fallback: number, max: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(`Expected integer between 1 and ${max}`);
  }
  return parsed;
}

export function normalizeAutofillOptions(options: AutofillOptions): Required<AutofillOptions> {
  return {
    targetFutureDays: parsePositiveInteger(options.targetFutureDays, 30, 365),
    lookbackDays: parsePositiveInteger(options.lookbackDays, 180, 3650),
    minQualityScore: parsePositiveInteger(options.minQualityScore, 50, 200),
    dryRun: options.dryRun === true,
  };
}

export async function autofillWords(redisClient: RedisClientType, options: AutofillOptions = {}): Promise<AutofillResult> {
  if (!redisClient.isReady) throw new Error('Redis client is not ready');

  const normalized = normalizeAutofillOptions(options);
  const today = getToday();
  const futureDates = Array.from({ length: normalized.targetFutureDays }, (_, i) => addDays(today, i + 1));
  const futureValues = await redisClient.mGet(futureDates);

  const missingDates: string[] = [];
  const skippedExistingDates: string[] = [];
  const futureWords = new Set<string>();

  for (let i = 0; i < futureDates.length; i++) {
    const value = futureValues[i];
    if (value) {
      skippedExistingDates.push(futureDates[i]);
      futureWords.add(value.toLowerCase());
    } else {
      missingDates.push(futureDates[i]);
    }
  }

  const recentDates = Array.from({ length: normalized.lookbackDays + 1 }, (_, i) => addDays(today, -i));
  const recentValues = await redisClient.mGet(recentDates);
  const recentlyUsedWords = new Set(recentValues.filter((word): word is string => Boolean(word)).map((word) => word.toLowerCase()));

  const { candidates, stats } = loadWordCandidates();
  let usableCandidates = candidates.filter((candidate) => {
    return candidate.score >= normalized.minQualityScore && !recentlyUsedWords.has(candidate.word) && !futureWords.has(candidate.word);
  });

  const warnings: string[] = [];
  if (usableCandidates.length < missingDates.length) {
    warnings.push('Not enough candidates met minQualityScore; falling back to lower-scored eligible candidates');
    usableCandidates = candidates.filter((candidate) => !recentlyUsedWords.has(candidate.word) && !futureWords.has(candidate.word));
  }

  const scheduled: Record<string, string> = {};
  const selectedWords = usableCandidates.slice(0, missingDates.length).map((candidate) => candidate.word);

  if (selectedWords.length < missingDates.length) {
    warnings.push(`Only ${selectedWords.length} words available for ${missingDates.length} missing dates`);
  }

  for (let i = 0; i < selectedWords.length; i++) {
    const date = missingDates[i];
    const word = selectedWords[i];

    if (normalized.dryRun) {
      scheduled[date] = word;
      continue;
    }

    const result = await redisClient.set(date, word, { NX: true });
    if (result === 'OK') {
      scheduled[date] = word;
    } else {
      warnings.push(`Skipped ${date}; it was scheduled before write`);
    }
  }

  return {
    today,
    targetFutureDays: normalized.targetFutureDays,
    lookbackDays: normalized.lookbackDays,
    minQualityScore: normalized.minQualityScore,
    dryRun: normalized.dryRun,
    currentlyScheduledFutureDays: skippedExistingDates.length,
    needed: missingDates.length,
    scheduled,
    skippedExistingDates,
    warnings,
    candidateStats: { ...stats, usableCandidates: usableCandidates.length },
  };
}
