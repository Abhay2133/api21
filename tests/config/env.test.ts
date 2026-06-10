import { describe, expect, test, afterAll, beforeAll } from "bun:test";
import { env } from "../../src/config/env";
import { loadEnv } from "../../src/config/dotenv";
import fs from "node:fs";
import path from "node:path";

describe("env configuration", () => {
  test("should export a valid configuration object", () => {
    expect(env).toBeDefined();
    expect(typeof env.port).toBe("number");
    expect(typeof env.nodeEnv).toBe("string");
    expect(typeof env.databaseUrl).toBe("string");
    expect(typeof env.redisUrl).toBe("string");
  });

  describe("dotenv file priority resolution", () => {
    let tempDir: string;
    const envVarName = "TEST_ENV_PRIORITY_VAR";

    beforeAll(() => {
      tempDir = fs.mkdtempSync(path.join(process.cwd(), "tmp-env-test-"));
      // Create .env, .env.local, .env.test files in tempDir
      fs.writeFileSync(path.join(tempDir, ".env"), `${envVarName}=env-val\n`);
      fs.writeFileSync(path.join(tempDir, ".env.local"), `${envVarName}=local-val\n`);
      fs.writeFileSync(path.join(tempDir, ".env.test"), `${envVarName}=test-val\n`);
    });

    afterAll(() => {
      // Clean up files and directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore
      }
    });

    test("should prioritize .env.test in test and ci env", () => {
      delete process.env[envVarName];
      loadEnv({ nodeEnv: "test", ci: "false", cwd: tempDir });
      expect(process.env[envVarName]).toBe("test-val");
    });

    test("should prioritize .env.test if CI environment variable is true", () => {
      delete process.env[envVarName];
      loadEnv({ nodeEnv: "development", ci: "true", cwd: tempDir });
      expect(process.env[envVarName]).toBe("test-val");
    });

    test("should prioritize .env.local in local development env", () => {
      delete process.env[envVarName];
      loadEnv({ nodeEnv: "development", ci: "false", cwd: tempDir });
      expect(process.env[envVarName]).toBe("local-val");
    });

    test("should use .env in prod and ignore local/test files", () => {
      delete process.env[envVarName];
      loadEnv({ nodeEnv: "production", ci: "false", cwd: tempDir });
      expect(process.env[envVarName]).toBe("env-val");
    });
  });
});

