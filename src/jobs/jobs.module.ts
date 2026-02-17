import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PingJob } from './ping.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PingJob],
})
export class JobModule {}
