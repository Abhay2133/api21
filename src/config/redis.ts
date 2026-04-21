import { createClient, type RedisClientType } from "redis";
import { env } from "./env";

let client: RedisClientType;

export function getRedisClient(): RedisClientType {
  return client;
}

export async function connectRedis(): Promise<void> {
  client = createClient({ url: env.redisUrl }) as RedisClientType;

  client.on("connect", () => console.log("[redis] connected:", env.redisUrl));
  client.on("error", (err) => console.error("[redis] error:", err));
  client.on("end", () => console.warn("[redis] disconnected"));

  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  await client?.quit();
}
