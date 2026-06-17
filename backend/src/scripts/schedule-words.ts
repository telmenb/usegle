import { getRedisClient } from '../services/redis';
import { autofillWords, AutofillOptions } from '../services/word-scheduler-service';

function parseArgs(argv: string[]): AutofillOptions {
  const options: AutofillOptions = {};

  for (const arg of argv) {
    if (arg === '--dryRun' || arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    const match = arg.match(/^--([^=]+)=(.+)$/);
    if (!match) continue;

    const [, key, value] = match;
    if (key === 'targetFutureDays') options.targetFutureDays = Number(value);
    if (key === 'lookbackDays') options.lookbackDays = Number(value);
    if (key === 'minQualityScore') options.minQualityScore = Number(value);
  }

  return options;
}

async function waitForRedisReady(timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  const redisClient = getRedisClient();

  while (!redisClient.isReady) {
    if (Date.now() - started > timeoutMs) throw new Error('Timed out waiting for Redis connection');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function main() {
  const redisClient = getRedisClient();
  await waitForRedisReady();

  const result = await autofillWords(redisClient, parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));

  await redisClient.quit();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
