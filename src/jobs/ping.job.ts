import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';

@Injectable()
export class PingJob {
  private readonly logger = new Logger(PingJob.name);

  constructor(
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const url = this.configService.get<string>('PING_URL') || '';
    const cronJobExpression =
      this.configService.get<string>('PING_INTERVAL_EXPRESSION') ||
      CronExpression.EVERY_5_MINUTES;
    if (!url) {
      this.logger.warn('No PING_URL is defined !');
    }

    const job = new CronJob(cronJobExpression, () => {
      fetch(url)
        .then((res) => res.text())
        .then((text) => this.logger.debug(text))
        .catch((error) => this.logger.error(error));
    });
    this.schedulerRegistry.addCronJob('ping-job', job);

    job.start();

    this.logger.debug(
      `PING JOB ADDED URL (${url}) with (${cronJobExpression})`,
    );
  }
}
