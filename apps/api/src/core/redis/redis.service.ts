import { Injectable, OnModuleInit, OnApplicationShutdown, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { config } from '../../config/env.js';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  onModuleInit() {
    this.initClient();
  }

  private initClient(): Redis | null {
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
        this.logger.log('Redis connected successfully.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection warning: ${err.message}`);
      });

      return this.client;
    } catch (err) {
      this.logger.warn(`Failed to initialize Redis client: ${err}`);
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
    if (!this.client) return false;
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async onApplicationShutdown() {
    if (this.client) {
      this.logger.log('Closing Redis connection...');
      try {
        await this.client.quit();
      } catch (err) {
        this.logger.warn(`Error disconnecting Redis: ${err}`);
      }
    }
  }
}
