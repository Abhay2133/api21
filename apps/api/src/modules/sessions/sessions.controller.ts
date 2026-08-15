import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionsService } from './sessions.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() dto: CreateSessionDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const data = await this.sessionsService.createSession(dto, ip, userAgent);
    return {
      status: 'success',
      data,
    };
  }

  @Get()
  async getActiveSessions(@Query('username') username?: string) {
    const data = await this.sessionsService.getActiveSessions(username);
    return {
      status: 'success',
      data,
    };
  }

  @Delete('token/:token')
  async revokeSessionByToken(@Param('token') token: string) {
    return this.sessionsService.revokeSessionByToken(token);
  }

  @Delete(':id')
  async revokeSessionById(@Param('id') id: string) {
    return this.sessionsService.revokeSessionById(id);
  }
}
