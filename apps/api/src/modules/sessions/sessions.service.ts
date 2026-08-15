import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import crypto from 'crypto';
import { DatabaseService } from '../../core/database/database.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';

export interface Session {
  id: number;
  token: string;
  username: string;
  ip_address: string;
  user_agent: string;
  session_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  generateSessionHash(username: string, ip: string, ua: string): string {
    const normalizedIp = ip === '::1' || ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip.trim();
    const data = [ua, normalizedIp, username].join('|');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async createSession(
    dto: CreateSessionDto,
    ip: string,
    userAgent: string
  ): Promise<Session> {
    try {
      const { username, deactivateOthers } = dto;
      const token = crypto.randomBytes(32).toString('hex');
      const sessionHash = this.generateSessionHash(username, ip, userAgent);

      if (deactivateOthers) {
        await this.databaseService.query(
          'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE username = $1',
          [username]
        );
      }

      const result = await this.databaseService.query<Session>(
        `INSERT INTO sessions (token, username, ip_address, user_agent, session_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id, token, username, ip_address, user_agent, session_hash, is_active, created_at, updated_at`,
        [token, username, ip, userAgent, sessionHash]
      );

      return result.rows[0];
    } catch (err: any) {
      this.logger.error('createSession error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to create session' });
    }
  }

  async getActiveSessions(username?: string): Promise<Session[]> {
    if (!username || typeof username !== 'string') {
      throw new BadRequestException({ status: 'error', message: 'Username query parameter is required' });
    }

    try {
      const result = await this.databaseService.query<Session>(
        'SELECT id, token, username, ip_address, user_agent, session_hash, is_active, created_at, updated_at FROM sessions WHERE username = $1 AND is_active = true ORDER BY created_at DESC',
        [username]
      );

      return result.rows;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('getActiveSessions error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to fetch sessions' });
    }
  }

  async revokeSessionByToken(token: string): Promise<{ status: string; message: string }> {
    try {
      const result = await this.databaseService.query(
        'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE token = $1 RETURNING id',
        [token]
      );

      if (result.rows.length === 0) {
        throw new NotFoundException({ status: 'error', message: 'Session not found' });
      }

      return {
        status: 'success',
        message: 'Session revoked successfully',
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error('revokeSessionByToken error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to revoke session' });
    }
  }

  async revokeSessionById(id: string | number): Promise<{ status: string; message: string }> {
    try {
      const result = await this.databaseService.query(
        'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundException({ status: 'error', message: 'Session not found' });
      }

      return {
        status: 'success',
        message: `Session ${id} revoked successfully`,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error('revokeSessionById error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to revoke session' });
    }
  }
}
