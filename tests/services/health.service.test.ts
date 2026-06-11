// @vitest-environment node
import { vi, describe, expect, it, beforeEach } from "vitest";

const mockRedisClient = {
  ping: vi.fn(),
};

vi.mock("../../server/utils/db", () => ({
  db: {
    raw: vi.fn(),
  },
}));

vi.mock("../../server/utils/redis", () => ({
  getRedisClient: () => mockRedisClient,
}));

import { db } from "../../server/utils/db";
import { getHealthStatus } from "../../server/services/health.service";

describe("health.service", () => {
  beforeEach(() => {
    vi.mocked(db.raw).mockClear();
    vi.mocked(mockRedisClient.ping).mockClear();
  });

  it("should return up when both postgres and redis are online", async () => {
    vi.mocked(db.raw).mockResolvedValue({} as never);
    vi.mocked(mockRedisClient.ping).mockResolvedValue("PONG" as never);

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "up", redis: "up" });
    expect(db.raw).toHaveBeenCalledWith("SELECT 1");
    expect(mockRedisClient.ping).toHaveBeenCalled();
  });

  it("should handle postgres down and redis up", async () => {
    vi.mocked(db.raw).mockRejectedValue(new Error("Database Down") as never);
    vi.mocked(mockRedisClient.ping).mockResolvedValue("PONG" as never);

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "down", redis: "up" });
  });

  it("should handle postgres up and redis down", async () => {
    vi.mocked(db.raw).mockResolvedValue({} as never);
    vi.mocked(mockRedisClient.ping).mockRejectedValue(new Error("Redis Down") as never);

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "up", redis: "down" });
  });

  it("should handle both postgres and redis down", async () => {
    vi.mocked(db.raw).mockRejectedValue(new Error("Database Down") as never);
    vi.mocked(mockRedisClient.ping).mockRejectedValue(new Error("Redis Down") as never);

    const status = await getHealthStatus();

    expect(status).toEqual({ status: "ok", postgres: "down", redis: "down" });
  });
});
