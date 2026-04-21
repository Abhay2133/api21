import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../config/redis";

function makeStore() {
  return new RedisStore({
    // rate-limit-redis v4 requires a sendCommand wrapper
    sendCommand: (...args: string[]) => getRedisClient().sendCommand(args),
  });
}

// Global limiter — applied to all routes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, error: "Too many requests, please slow down." },
});

// Strict limiter — for auth / sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, error: "Too many attempts, please try again later." },
});

// Per-minute burst limiter — for public APIs
export const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: makeStore(),
  message: { success: false, error: "Rate limit exceeded." },
});
