import { databaseService } from '../../core/database/database.service.js';
import { Session } from '@apps21/types';

export class SessionsModel {
  async create(
    token: string,
    username: string,
    ipAddress: string,
    userAgent: string,
    sessionHash: string
  ): Promise<Session> {
    const result = await databaseService.query<Session>(
      `INSERT INTO sessions (token, username, ip_address, user_agent, session_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, token, username, ip_address, user_agent, session_hash, is_active, created_at, updated_at`,
      [token, username, ipAddress, userAgent, sessionHash]
    );
    return result.rows[0];
  }

  async findActive(username?: string): Promise<Session[]> {
    if (username) {
      const result = await databaseService.query<Session>(
        'SELECT id, token, username, ip_address, user_agent, is_active, created_at, updated_at FROM sessions WHERE is_active = true AND username = $1 ORDER BY id DESC',
        [username]
      );
      return result.rows;
    }

    const result = await databaseService.query<Session>(
      'SELECT id, token, username, ip_address, user_agent, is_active, created_at, updated_at FROM sessions WHERE is_active = true ORDER BY id DESC'
    );
    return result.rows;
  }

  async findByToken(token: string): Promise<Session | null> {
    const result = await databaseService.query<Session>(
      'SELECT id, token, username, ip_address, user_agent, is_active, created_at, updated_at FROM sessions WHERE token = $1 AND is_active = true',
      [token]
    );
    return result.rows[0] || null;
  }

  async revokeByToken(token: string): Promise<boolean> {
    const result = await databaseService.query(
      'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE token = $1 RETURNING id',
      [token]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async revokeById(id: number): Promise<boolean> {
    const result = await databaseService.query(
      'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupOldSessions(days = 30): Promise<number> {
    const result = await databaseService.query(
      `DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '${days} days'`
    );
    return result.rowCount ?? 0;
  }
}

export const sessionsModel = new SessionsModel();
