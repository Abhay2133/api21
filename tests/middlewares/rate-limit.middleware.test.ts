import { mock, describe, expect, test } from "bun:test";

const mockRedisClient = {
  sendCommand: mock(() => "mock-sha"),
};

// Mock redis client configuration to avoid connection error on require
mock.module("../../src/config/redis", () => ({
  getRedisClient: () => mockRedisClient,
}));

import { initRateLimiters, globalLimiter, strictLimiter, burstLimiter } from "../../src/middlewares/rate-limit.middleware";

describe("rate-limit.middleware", () => {
  test("should initialize rate limiters correctly", () => {
    initRateLimiters();
    expect(globalLimiter).toBeDefined();
    expect(strictLimiter).toBeDefined();
    expect(burstLimiter).toBeDefined();
    expect(typeof globalLimiter).toBe("function");
    expect(typeof strictLimiter).toBe("function");
    expect(typeof burstLimiter).toBe("function");
  });
});
