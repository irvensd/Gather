export function isRateLimited(
  events: readonly { action: string; createdAt: string }[],
  action: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const recent = events.filter((event) => event.action === action && now - new Date(event.createdAt).getTime() < windowMs);
  return recent.length >= max;
}
