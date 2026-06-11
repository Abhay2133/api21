import { defineEventHandler, setResponseHeader, createError } from "h3";
import { getRedisClient } from "../utils/redis";

// Rate limit config (mirrors the old express-rate-limit setup)
const LIMITS = {
  global: { requests: 200, windowMs: 15 * 60 * 1000 }, // 200 req / 15 min
} as const;

// Lightweight sliding window rate limiter using Redis INCR + EXPIRE
async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisClient();
  const windowSec = Math.ceil(windowMs / 1000);

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSec);
  }

  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);
  return { allowed, remaining };
}

export default defineEventHandler(async (event) => {
  const url = event.node.req.url ?? "";

  // Only rate-limit API routes
  if (!url.startsWith("/api/")) return;

  const ip =
    (event.node.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    event.node.req.socket?.remoteAddress ||
    "unknown";

  const key = `ratelimit:global:${ip}`;

  try {
    const { allowed, remaining } = await checkRateLimit(
      key,
      LIMITS.global.requests,
      LIMITS.global.windowMs
    );

    setResponseHeader(event, "X-RateLimit-Limit", String(LIMITS.global.requests));
    setResponseHeader(event, "X-RateLimit-Remaining", String(remaining));

    if (!allowed) {
      throw createError({
        statusCode: 429,
        message: "Too many requests, please slow down.",
      });
    }
  } catch (err: any) {
    // If Redis is unavailable, fail open (don't block traffic)
    if (err.statusCode === 429) throw err;
    console.error("[rate-limit] Redis error, failing open:", err.message);
  }
});
