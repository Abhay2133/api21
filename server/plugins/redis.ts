import { connectRedis, disconnectRedis } from "../utils/redis";

export default defineNitroPlugin(async (nitroApp) => {
  await connectRedis();

  nitroApp.hooks.hookOnce("close", async () => {
    await disconnectRedis();
    console.log("[redis] disconnected on shutdown");
  });
});
