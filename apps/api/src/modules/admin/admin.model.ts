import { databaseService } from '../../core/database/database.service.js';
import { Session } from '@api21/types';

export interface DeploymentItem {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentLogItem {
  id: number;
  deployment_id: string;
  message: string;
  created_at: string;
}

export class AdminModel {
  async getAdminStats(): Promise<{ totalUsers: number; activeSessions: number; totalDeployments: number }> {
    const [usersCount, sessionsCount, deploymentsCount] = await Promise.all([
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM sessions WHERE is_active = true'),
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM deployments'),
    ]);

    return {
      totalUsers: parseInt(usersCount.rows[0]?.count || '0', 10),
      activeSessions: parseInt(sessionsCount.rows[0]?.count || '0', 10),
      totalDeployments: parseInt(deploymentsCount.rows[0]?.count || '0', 10),
    };
  }

  async createAdminSession(
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

  async findSessionByToken(token: string): Promise<Session | null> {
    const result = await databaseService.query<Session>(
      'SELECT id, token, username, ip_address, user_agent, is_active, created_at, updated_at FROM sessions WHERE token = $1 AND is_active = true',
      [token]
    );
    return result.rows[0] || null;
  }

  async revokeSession(token: string): Promise<boolean> {
    const result = await databaseService.query(
      'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE token = $1',
      [token]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getSessions(limit = 100, offset = 0): Promise<Session[]> {
    const result = await databaseService.query<Session>(
      'SELECT id, username, ip_address, user_agent, is_active, created_at, updated_at FROM sessions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async getSessionById(id: number | string): Promise<Session | null> {
    const result = await databaseService.query<Session>(
      'SELECT id, username, ip_address, user_agent, is_active, created_at, updated_at FROM sessions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async deactivateSessionById(id: number | string): Promise<boolean> {
    const result = await databaseService.query(
      'UPDATE sessions SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getDeployments(limit = 50, offset = 0): Promise<DeploymentItem[]> {
    const result = await databaseService.query<DeploymentItem>(
      'SELECT id, status, created_at, updated_at FROM deployments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async getDeploymentLogs(deploymentId: string): Promise<DeploymentLogItem[]> {
    const result = await databaseService.query<DeploymentLogItem>(
      'SELECT id, deployment_id, message, created_at FROM deployment_logs WHERE deployment_id = $1 ORDER BY id ASC',
      [deploymentId]
    );
    return result.rows;
  }
}

export const adminModel = new AdminModel();
