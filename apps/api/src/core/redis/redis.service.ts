import { Redis } from 'ioredis';
import { config } from '../../config/env.js';

export class RedisService {
  private client: Redis | null = null;
  public isConnected = false;

  initClient(): Redis | null {
    if (this.client) return this.client;

    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy(times) {
          if (times > 3) {
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Redis] Connected successfully.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        console.warn(`[Redis] Warning: ${err.message}`);
      });

      return this.client;
    } catch (err) {
      console.warn(`[Redis] Failed to initialize Redis client: ${err}`);
      return null;
    }
  }

  getClient(): Redis | null {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.client) {
      this.initClient();
    }
    if (!this.client) return false;
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        console.warn(`[Redis] Error disconnecting: ${err}`);
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    return this.close();
  }
}

export const redisService = new RedisService();
