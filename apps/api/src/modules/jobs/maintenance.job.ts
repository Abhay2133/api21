import { Queue, Worker, Job } from 'bullmq';
import { exec } from 'node:child_process';
import { bullMQService, BullMQService } from '../../core/bullmq/bullmq.service.js';

export interface MaintenanceJobData {
  action: 'pm2_restart' | string;
  command?: string;
  triggeredBy?: string;
}

export interface MaintenanceJobResult {
  success: boolean;
  action: string;
  output?: string;
  error?: string;
  executedAt: string;
}

export const MAINTENANCE_QUEUE_NAME = 'maintenanceQueue';
export const PM2_RESTART_JOB_NAME = 'nightly-pm2-restart';
export const DEFAULT_PM2_RESTART_CRON = '0 0 * * *'; // 12:00 AM (Midnight) every day
export const DEFAULT_PM2_RESTART_CMD = 'npx pm2 restart all';

let maintenanceQueueInstance: Queue<MaintenanceJobData, MaintenanceJobResult> | null = null;
let maintenanceWorkerInstance: Worker<MaintenanceJobData, MaintenanceJobResult> | null = null;

export const resetMaintenanceQueueInstance = () => {
  maintenanceQueueInstance = null;
  maintenanceWorkerInstance = null;
};

/**
 * Executes a shell command (default: npx pm2 restart all) to restart server processes.
 */
export const executePm2Restart = async (
  command: string = process.env.PM2_RESTART_CMD || DEFAULT_PM2_RESTART_CMD
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`PM2 command execution failed: ${err.message}. Stderr: ${stderr}`));
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

/**
 * Returns or initializes the maintenance BullMQ queue.
 */
export const getMaintenanceQueue = (
  service: BullMQService = bullMQService
): Queue<MaintenanceJobData, MaintenanceJobResult> => {
  if (!maintenanceQueueInstance) {
    const connection = service.getConnectionOptions();

    maintenanceQueueInstance = new Queue<MaintenanceJobData, MaintenanceJobResult>(
      MAINTENANCE_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 100 },
        },
      }
    );

    service.registerQueue(maintenanceQueueInstance);
  }
  return maintenanceQueueInstance;
};

/**
 * Registers a repeatable Cron job in BullMQ to trigger PM2 restart every night at 12:00 AM (00:00).
 */
export const scheduleNightlyPm2Restart = async (
  queue: Queue<MaintenanceJobData, MaintenanceJobResult> = getMaintenanceQueue(),
  options: { pattern?: string; command?: string } = {}
) => {
  const pattern = options.pattern || process.env.PM2_RESTART_CRON || DEFAULT_PM2_RESTART_CRON;
  const command = options.command || process.env.PM2_RESTART_CMD || DEFAULT_PM2_RESTART_CMD;

  try {
    const jobScheduler = await queue.upsertJobScheduler(
      'nightly-pm2-restart-scheduler',
      { pattern },
      {
        name: PM2_RESTART_JOB_NAME,
        data: {
          action: 'pm2_restart',
          command,
          triggeredBy: 'nightly-cron-schedule',
        },
        opts: {
          removeOnComplete: { count: 30 },
          removeOnFail: { count: 50 },
        },
      }
    );

    console.log(
      `[MaintenanceJob] Nightly PM2 restart repeatable cron scheduler registered with pattern "${pattern}" (cmd: "${command}").`
    );
    return jobScheduler;
  } catch (err: any) {
    console.warn('[MaintenanceJob] Failed to schedule repeatable PM2 restart job:', err?.message || err);
    return null;
  }
};

/**
 * Initializes the standalone BullMQ worker for maintenance jobs.
 */
export const initMaintenanceWorker = (
  service: BullMQService = bullMQService
): Worker<MaintenanceJobData, MaintenanceJobResult> => {
  if (!maintenanceWorkerInstance) {
    const connection = service.getConnectionOptions();

    maintenanceWorkerInstance = new Worker<MaintenanceJobData, MaintenanceJobResult>(
      MAINTENANCE_QUEUE_NAME,
      async (job: Job<MaintenanceJobData, MaintenanceJobResult>): Promise<MaintenanceJobResult> => {
        console.log(
          `[MaintenanceWorker] Processing maintenance job "${job.name}" (ID: ${job.id}) with action "${job.data.action}"`
        );

        if (job.data.action === 'pm2_restart') {
          const cmd = job.data.command || process.env.PM2_RESTART_CMD || DEFAULT_PM2_RESTART_CMD;
          console.log(`[MaintenanceWorker] Executing scheduled health restart command: "${cmd}"`);

          try {
            const { stdout, stderr } = await executePm2Restart(cmd);
            const output = stdout || stderr || 'Process restart command executed successfully.';
            console.log(`[MaintenanceWorker] Scheduled restart finished:\n${output}`);

            return {
              success: true,
              action: 'pm2_restart',
              output,
              executedAt: new Date().toISOString(),
            };
          } catch (err: any) {
            console.error(`[MaintenanceWorker] Error executing PM2 restart: ${err.message}`);
            return {
              success: false,
              action: 'pm2_restart',
              error: err.message,
              executedAt: new Date().toISOString(),
            };
          }
        }

        return {
          success: true,
          action: job.data.action,
          output: `Unknown or no-op maintenance action: "${job.data.action}"`,
          executedAt: new Date().toISOString(),
        };
      },
      { connection, concurrency: 1 }
    );

    service.registerWorker(maintenanceWorkerInstance);

    maintenanceWorkerInstance.on(
      'completed',
      (job: Job<MaintenanceJobData, MaintenanceJobResult>, result: MaintenanceJobResult) => {
        console.log(
          `[MaintenanceWorker] Maintenance job "${job.name}" (${job.id}) completed successfully:`,
          result.output || result.action
        );
      }
    );

    maintenanceWorkerInstance.on(
      'failed',
      (job: Job<MaintenanceJobData, MaintenanceJobResult> | undefined, err: Error) => {
        console.warn(
          `[MaintenanceWorker] Maintenance job "${job?.name}" (${job?.id}) failed:`,
          err.message
        );
      }
    );
  }
  return maintenanceWorkerInstance;
};
