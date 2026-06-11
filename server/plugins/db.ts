import { connectDB, disconnectDB } from "../utils/db";

export default defineNitroPlugin(async (nitroApp) => {
  await connectDB();

  nitroApp.hooks.hookOnce("close", async () => {
    await disconnectDB();
    console.log("[pg] disconnected on shutdown");
  });
});
