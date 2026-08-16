import {
  getMaintenanceQueue,
  initMaintenanceWorker,
  scheduleNightlyPm2Restart,
  resetMaintenanceQueueInstance,
  MAINTENANCE_QUEUE_NAME,
  PM2_RESTART_JOB_NAME,
  DEFAULT_PM2_RESTART_CRON,
} from '../../src/modules/jobs/maintenance.job.js';
import { bullMQService } from '../../src/core/bullmq/bullmq.service.js';

describe('Maintenance Job Service (Nightly PM2 Restart Cron)', () => {
  beforeEach(() => {
    resetMaintenanceQueueInstance();
  });

  afterAll(async () => {
    await bullMQService.closeAllQueuesAndWorkers(500);
  });

  it('should initialize and register maintenance queue with proper defaults', () => {
    const queue = getMaintenanceQueue(bullMQService);
    expect(queue).toBeDefined();
    expect(queue.name).toBe(MAINTENANCE_QUEUE_NAME);
  });

  it('should schedule nightly PM2 restart repeatable job with cron pattern "0 0 * * *"', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ id: 'repeat:123', name: PM2_RESTART_JOB_NAME });
    const mockQueue: any = {
      upsertJobScheduler: mockUpsert,
    };

    const job = await scheduleNightlyPm2Restart(mockQueue);
    expect(job).toBeDefined();
    expect(mockUpsert).toHaveBeenCalledWith(
      'nightly-pm2-restart-scheduler',
      expect.objectContaining({
        pattern: DEFAULT_PM2_RESTART_CRON,
      }),
      expect.objectContaining({
        name: PM2_RESTART_JOB_NAME,
        data: expect.objectContaining({
          action: 'pm2_restart',
          command: expect.any(String),
          triggeredBy: 'nightly-cron-schedule',
        }),
      })
    );
  });

  it('should initialize maintenance worker and register it in bullMQService', () => {
    const worker = initMaintenanceWorker(bullMQService);
    expect(worker).toBeDefined();
    expect(worker.name).toBe(MAINTENANCE_QUEUE_NAME);
  });
});
