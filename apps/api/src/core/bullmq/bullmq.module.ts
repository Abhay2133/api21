import { Global, Module } from '@nestjs/common';
import { BullMQService } from './bullmq.service.js';

@Global()
@Module({
  providers: [BullMQService],
  exports: [BullMQService],
})
export class BullMQModule {}
