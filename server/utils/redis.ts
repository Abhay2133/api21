import { createClient, type RedisClientType } from "redis";

let client: RedisClientType;

export function getRedisClient(): RedisClientType {
  return client;
}

export async function connectRedis(): Promise<void> {
  const config = useRuntimeConfig();
  client = createClient({ url: config.redisUrl }) as RedisClientType;

  client.on("connect", () => console.log("[redis] connected:", config.redisUrl));
  client.on("error", (err) => console.error("[redis] error:", err));
  client.on("end", () => console.warn("[redis] disconnected"));

  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  await client?.quit();
}
