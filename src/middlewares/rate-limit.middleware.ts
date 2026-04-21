import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../config/redis";

function makeLimiter(
  limit: number,
  windowMs: number,
  message: string
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => getRedisClient().sendCommand(args),
    }),
    message: { success: false, error: message },
  });
}

// Assigned by initRateLimiters() after Redis connects — safe to use in middleware
export let globalLimiter: RateLimitRequestHandler;
export let strictLimiter: RateLimitRequestHandler;
export let burstLimiter: RateLimitRequestHandler;

export function initRateLimiters(): void {
  globalLimiter = makeLimiter(200, 15 * 60 * 1000, "Too many requests, please slow down.");
  strictLimiter = makeLimiter(20, 15 * 60 * 1000, "Too many attempts, please try again later.");
  burstLimiter = makeLimiter(30, 60 * 1000, "Rate limit exceeded.");
}
