import cron, { type ScheduledTask } from "node-cron";

export interface CronJob {
  name: string;
  schedule: string; // cron expression
  handler: () => void | Promise<void>;
}

const tasks: ScheduledTask[] = [];

export function registerJobs(jobs: CronJob[]): void {
  for (const job of jobs) {
    const task = cron.schedule(job.schedule, async () => {
      try {
        await job.handler();
      } catch (err) {
        console.error(`[cron:${job.name}] error:`, err);
      }
    });
    tasks.push(task);
    console.log(`[cron] registered "${job.name}" → ${job.schedule}`);
  }
}

export function stopAllJobs(): void {
  tasks.forEach((t) => t.stop());
  console.log("[cron] all jobs stopped");
}
