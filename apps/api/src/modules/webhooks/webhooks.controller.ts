import {
  Controller,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('deploy')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleDeployWebhook(@Query('token') token?: string) {
    return this.webhooksService.handleDeployWebhook(token);
  }
}
