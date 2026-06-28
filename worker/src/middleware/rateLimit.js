import { getDailyUsage } from '../lib/db.js';

export const LIMITS = { free: 20, paid: 150 };

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkLimit(db, userId, tier) {
  const date = today();
  const limit = LIMITS[tier] ?? LIMITS.free;
  const usage = await getDailyUsage(db, userId, date);
  return { allowed: usage < limit, usage, limit, date };
}
