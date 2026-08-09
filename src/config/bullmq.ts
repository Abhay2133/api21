import { Queue, Worker, ConnectionOptions } from 'bullmq';
import { config } from './env.js';

const registeredQueues: Queue[] = [];
const registeredWorkers: Worker[] = [];

export const getBullMQConnectionOptions = (): ConnectionOptions => {
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
};

export const registerQueue = <T extends Queue>(queue: T): T => {
  registeredQueues.push(queue);
  return queue;
};

export const registerWorker = <T extends Worker>(worker: T): T => {
  registeredWorkers.push(worker);
  return worker;
};

export const closeAllQueuesAndWorkers = async (): Promise<void> => {
  console.log('[BullMQ] Gracefully closing workers and queues...');
  await Promise.all(registeredWorkers.map((worker) => worker.close().catch(() => {})));
  await Promise.all(registeredQueues.map((queue) => queue.close().catch(() => {})));
  console.log('[BullMQ] All workers and queues closed.');
};

export const checkQueueHealth = async (): Promise<boolean> => {
  if (registeredQueues.length === 0) return true;
  try {
    for (const queue of registeredQueues) {
      const client = await (queue as any).client;
      if (client && typeof client.ping === 'function') {
        const ping = await client.ping();
        if (ping !== 'PONG') return false;
      } else {
        await queue.waitUntilReady();
      }
    }
    return true;
  } catch {
    return false;
  }
};
