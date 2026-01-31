export const APP_TZ_SUFFIX = process.env.APP_TZ_SUFFIX || '+08:00';
export function startOfDay(date: string): Date {
  return new Date(`${date}T00:00:00.000${APP_TZ_SUFFIX}`);
}
export function endOfDay(date: string): Date {
  return new Date(`${date}T23:59:59.999${APP_TZ_SUFFIX}`);
}
