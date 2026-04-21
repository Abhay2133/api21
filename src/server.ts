import app from "./app";
import { connectDB, disconnectDB } from "./config/db";
import { connectRedis, disconnectRedis } from "./config/redis";
import { env } from "./config/env";
import { registerJobs, stopAllJobs } from "./jobs";
import { pingJob } from "./jobs/ping.job";
import { initRateLimiters } from "./middlewares/rate-limit.middleware";

async function bootstrap() {
  await connectDB();
  await connectRedis();
  initRateLimiters();

  registerJobs([pingJob]);

  const server = app.listen(env.port, () => {
    console.log(`[server] running on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(async () => {
      stopAllJobs();
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
