export const getToday = (): string => new Date().toISOString().slice(0, 10);

export function isGameDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function coverage(
  today: string,
  scheduled: Record<string, unknown>,
  horizon = 365,
) {
  let futureScheduledDays = 0;
  while (
    futureScheduledDays < horizon &&
    scheduled[addDays(today, futureScheduledDays + 1)]
  ) {
    futureScheduledDays++;
  }
  return {
    today,
    todayScheduled: Boolean(scheduled[today]),
    futureScheduledDays,
    firstMissingDate: addDays(today, futureScheduledDays + 1),
    lowInventory: futureScheduledDays < 7,
  };
}
