import { db } from "../config/db";
import { getRedisClient } from "../config/redis";

export async function getHealthStatus() {
  let postgres = "down";
  try {
    await db.raw("SELECT 1");
    postgres = "up";
  } catch {
    // db not connected or error
  }

  let redis = "down";
  try {
    const pong = await getRedisClient().ping();
    redis = pong === "PONG" ? "up" : "down";
  } catch {
    // client not connected
  }

  return { status: "ok", postgres, redis };
}
