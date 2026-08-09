import { Redis } from 'ioredis';
import { config } from './env.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export const initRedis = (): Redis | null => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('[Redis] Connected successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn('[Redis] Connection warning:', err.message);
    });

    return redisClient;
  } catch (err) {
    console.warn('[Redis] Failed to initialize Redis client:', err);
    return null;
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  if (!redisClient) return false;
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};
