import crypto from 'crypto';
import { CreateSessionDto, Session } from '@apps21/types';
import { sessionsModel, SessionsModel } from './sessions.model.js';
import { AppError } from '../../common/middleware/error.middleware.js';

export class SessionsService {
  constructor(private readonly model: SessionsModel = sessionsModel) {}

  async createSession(dto: CreateSessionDto, ip: string, userAgent: string): Promise<Session> {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionHash = crypto.createHash('sha256').update(`${token}:${dto.username}`).digest('hex');

    return this.model.create(token, dto.username, ip, userAgent, sessionHash);
  }

  async getActiveSessions(username?: string): Promise<Session[]> {
    return this.model.findActive(username);
  }

  async revokeSessionByToken(token: string): Promise<{ success: boolean; message: string }> {
    const revoked = await this.model.revokeByToken(token);
    if (!revoked) {
      throw new AppError(`Session with token not found or already revoked`, 404);
    }
    return { success: true, message: 'Session revoked successfully' };
  }

  async revokeSessionById(id: number | string): Promise<{ success: boolean; message: string }> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
      throw new AppError('Invalid session ID', 400);
    }

    const revoked = await this.model.revokeById(numericId);
    if (!revoked) {
      throw new AppError(`Session #${id} not found or already revoked`, 404);
    }
    return { success: true, message: `Session #${id} revoked successfully` };
  }
}

export const sessionsService = new SessionsService();
