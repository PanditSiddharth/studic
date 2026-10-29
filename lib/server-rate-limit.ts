import connectDB from "@/connectDB";
import { RateLimitModel } from "@/modals/rate-limit.model";

const localCache = new Map<string, { windowStart: number; count: number }>();

export async function consumeServerRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const safeKey = key.slice(0, 180);
  const local = localCache.get(safeKey);
  if (local?.windowStart === windowStart) {
    local.count += 1;
    return { allowed: local.count <= limit, retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)) };
  }
  localCache.set(safeKey, { windowStart, count: 1 });
  if (localCache.size > 5000) localCache.delete(localCache.keys().next().value as string);

  await connectDB();
  const result = await RateLimitModel.findOneAndUpdate(
    { key: safeKey, windowStart: new Date(windowStart), count: { $lt: limit } },
    { $inc: { count: 1 }, $set: { expiresAt: new Date(windowStart + windowMs + 60_000) } },
    { new: true }
  ).lean();
  if (result) return { allowed: true, retryAfter: 0 };

  const existing = await RateLimitModel.findOne({ key: safeKey }).lean();
  if (!existing || existing.windowStart.getTime() !== windowStart) {
    await RateLimitModel.updateOne(
      { key: safeKey },
      { $set: { windowStart: new Date(windowStart), count: 1, expiresAt: new Date(windowStart + windowMs + 60_000) } },
      { upsert: true }
    );
    return { allowed: true, retryAfter: 0 };
  }
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)) };
}
