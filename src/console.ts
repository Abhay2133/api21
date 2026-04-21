import "dotenv/config";
import repl from "node:repl";
import { connectDB, disconnectDB } from "./config/db";
import { connectRedis, disconnectRedis, getRedisClient } from "./config/redis";
import * as models from "./models";
import * as services from "./services";

async function startConsole() {
  console.log("[console] connecting...");
  await connectDB();
  await connectRedis();
  console.log("[console] ready. Ctrl+D or .exit to quit.\n");

  const r = repl.start({ prompt: "api21> ", useGlobal: false });

  // inject app context into REPL global
  Object.assign(r.context, {
    ...models,
    services,
    redis: getRedisClient(),
  });

  r.on("exit", async () => {
    await disconnectDB();
    await disconnectRedis();
    process.exit(0);
  });
}

startConsole().catch((err) => {
  console.error(err);
  process.exit(1);
});
