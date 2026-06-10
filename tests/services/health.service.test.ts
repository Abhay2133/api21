import { mock, describe, expect, test, beforeEach } from "bun:test";

const mockDb = {
  raw: mock(),
};

const mockRedisClient = {
  ping: mock(),
};

mock.module("../../src/config/db", () => ({
  db: mockDb,
}));

mock.module("../../src/config/redis", () => ({
  getRedisClient: () => mockRedisClient,
}));

import { getHealthStatus } from "../../src/services/health.service";

describe("health.service", () => {
  beforeEach(() => {
    mockDb.raw.mockClear();
    mockRedisClient.ping.mockClear();
  });

  test("should return up when both postgres and redis are online", async () => {
    mockDb.raw.mockResolvedValue({});
    mockRedisClient.ping.mockResolvedValue("PONG");

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "up", redis: "up" });
    expect(mockDb.raw).toHaveBeenCalledWith("SELECT 1");
    expect(mockRedisClient.ping).toHaveBeenCalled();
  });

  test("should handle postgres down and redis up", async () => {
    mockDb.raw.mockRejectedValue(new Error("Database Down"));
    mockRedisClient.ping.mockResolvedValue("PONG");

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "down", redis: "up" });
  });

  test("should handle postgres up and redis down", async () => {
    mockDb.raw.mockResolvedValue({});
    mockRedisClient.ping.mockRejectedValue(new Error("Redis Down"));

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "up", redis: "down" });
  });

  test("should handle both postgres and redis down", async () => {
    mockDb.raw.mockRejectedValue(new Error("Database Down"));
    mockRedisClient.ping.mockRejectedValue(new Error("Redis Down"));

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "down", redis: "down" });
  });
});
