import mongoose from "mongoose";
import { getRedisClient } from "../config/redis";

export async function getHealthStatus() {
  const mongo = mongoose.connection.readyState === 1 ? "up" : "down";

  let redis = "down";
  try {
    const pong = await getRedisClient().ping();
    redis = pong === "PONG" ? "up" : "down";
  } catch {
    // client not connected
  }

  return { status: "ok", mongo, redis };
}
