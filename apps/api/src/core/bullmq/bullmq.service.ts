import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { config } from '../../config/env.js';

@Injectable()
export class BullMQService implements OnApplicationShutdown {
  private readonly logger = new Logger(BullMQService.name);
  private registeredQueues: Queue[] = [];
  private registeredWorkers: Worker[] = [];

  getConnectionOptions(): ConnectionOptions {
    try {
      const url = new URL(config.redisUrl);
      return {
        host: url.hostname || '127.0.0.1',
        port: url.port ? parseInt(url.port, 10) : 6379,
        username: url.username || undefined,
        password: url.password || undefined,
        db: url.pathname ? parseInt(url.pathname.replace('/', ''), 10) || 0 : 0,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      };
    } catch {
      return {
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      };
    }
  }

  registerQueue<T extends Queue>(queue: T): T {
    this.registeredQueues.push(queue);
    return queue;
  }

  registerWorker<T extends Worker>(worker: T): T {
    this.registeredWorkers.push(worker);
    return worker;
  }

  getQueues(): Queue[] {
    return this.registeredQueues;
  }

  async closeAllQueuesAndWorkers(timeoutMs: number = 5000): Promise<void> {
    this.logger.log('Gracefully closing workers and queues...');
    const closePromise = (async () => {
      await Promise.all(this.registeredWorkers.map((worker) => worker.close().catch(() => {})));
      await Promise.all(this.registeredQueues.map((queue) => queue.close().catch(() => {})));
    })();

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.logger.warn(`Closing workers/queues timed out after ${timeoutMs}ms.`);
        resolve();
      }, timeoutMs);
    });

    await Promise.race([closePromise, timeoutPromise]);
    this.logger.log('All BullMQ workers and queues closed.');
  }

  async checkHealth(): Promise<boolean> {
    if (this.registeredQueues.length === 0) return true;
    try {
      const healthCheckPromise = (async () => {
        for (const queue of this.registeredQueues) {
          const client = await (queue as any).client;
          if (client && typeof client.ping === 'function') {
            const ping = await client.ping();
            if (ping !== 'PONG') return false;
          }
        }
        return true;
      })();

      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 2000);
      });

      return await Promise.race([healthCheckPromise, timeoutPromise]);
    } catch {
      return false;
    }
  }

  async onApplicationShutdown() {
    await this.closeAllQueuesAndWorkers(5000);
  }
}
