import { mock, describe, expect, test, beforeEach } from "bun:test";
import type { Request, Response, NextFunction } from "express";

const mockDb = {
  raw: mock(),
};

const mockRedisClient = {
  ping: mock(),
  sendCommand: mock(() => "mock-sha"),
};

mock.module("../../src/config/db", () => ({
  db: mockDb,
}));

mock.module("../../src/config/redis", () => ({
  getRedisClient: () => mockRedisClient,
  connectRedis: mock(),
  disconnectRedis: mock(),
}));

import { healthCheck } from "../../src/controllers/health.controller";

describe("health.controller", () => {
  beforeEach(() => {
    mockDb.raw.mockClear();
    mockRedisClient.ping.mockClear();
  });

  test("should respond with health status data when successful", async () => {
    mockDb.raw.mockResolvedValue({});
    mockRedisClient.ping.mockResolvedValue("PONG");

    const req = {} as Request;
    const res = {
      json: mock().mockReturnThis(),
    } as unknown as Response;
    const next = mock() as NextFunction;

    await healthCheck(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { status: "ok", postgres: "up", redis: "up" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should respond with down statuses when services are offline", async () => {
    mockDb.raw.mockRejectedValue(new Error("DB Down"));
    mockRedisClient.ping.mockRejectedValue(new Error("Redis Down"));

    const req = {} as Request;
    const res = {
      json: mock().mockReturnThis(),
    } as unknown as Response;
    const next = mock() as NextFunction;

    await healthCheck(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { status: "ok", postgres: "down", redis: "down" },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
