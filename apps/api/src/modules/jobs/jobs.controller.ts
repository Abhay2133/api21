import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { EnqueueJobDto } from './dto/enqueue-job.dto.js';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async enqueueJob(@Body() dto: EnqueueJobDto) {
    return this.jobsService.enqueueJob(dto);
  }

  @Get('metrics')
  async getQueueMetrics() {
    const metrics = await this.jobsService.getQueueMetrics();
    return {
      queue: 'sampleQueue',
      metrics,
    };
  }

  @Get(':jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getJobStatus(jobId);
  }
}
