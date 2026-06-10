import { describe, expect, test } from "bun:test";
import { env } from "../../src/config/env";

describe("env configuration", () => {
  test("should export a valid configuration object", () => {
    expect(env).toBeDefined();
    expect(typeof env.port).toBe("number");
    expect(typeof env.nodeEnv).toBe("string");
    expect(typeof env.databaseUrl).toBe("string");
    expect(typeof env.redisUrl).toBe("string");
  });
});
