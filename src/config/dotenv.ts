import dotenv from "dotenv";
import path from "path";

/**
 * Loads environment variables from the appropriate .env files.
 * Prioritization:
 * - Test/CI: .env.test takes priority, then .env
 * - Production: .env only
 * - Local Development: .env.local takes priority, then .env
 */
export function loadEnv(options: {
  nodeEnv?: string;
  ci?: string;
  cwd?: string;
} = {}) {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const isCI = options.ci ?? process.env.CI;
  const isTestOrCI = nodeEnv === "test" || isCI === "true" || (isCI !== undefined && isCI !== "false" && isCI !== "");
  const cwd = options.cwd ?? process.cwd();

  if (isTestOrCI) {
    dotenv.config({ path: path.resolve(cwd, ".env.test") });
    dotenv.config({ path: path.resolve(cwd, ".env") });
  } else if (nodeEnv === "production" || nodeEnv === "prod") {
    dotenv.config({ path: path.resolve(cwd, ".env") });
  } else {
    dotenv.config({ path: path.resolve(cwd, ".env.local") });
    dotenv.config({ path: path.resolve(cwd, ".env") });
  }
}

// Execute immediately when this module is imported
loadEnv();
