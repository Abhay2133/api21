import { databaseService } from '../../core/database/database.service.js';
import { Session, AdminUser } from '@api21/types';

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

export interface AdminUserRecord extends AdminUser {
  password_hash: string;
}

export class AdminModel {
  async getAdminStats(): Promise<{ totalUsers: number; activeSessions: number; totalDeployments: number; totalAdminUsers: number }> {
    const [usersCount, sessionsCount, deploymentsCount, adminUsersCount] = await Promise.all([
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM sessions WHERE is_active = true'),
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM deployments'),
      databaseService.query<{ count: string }>('SELECT COUNT(*) as count FROM admin_users'),
    ]);

    return {
      totalUsers: parseInt(usersCount.rows[0]?.count || '0', 10),
      activeSessions: parseInt(sessionsCount.rows[0]?.count || '0', 10),
      totalDeployments: parseInt(deploymentsCount.rows[0]?.count || '0', 10),
      totalAdminUsers: parseInt(adminUsersCount.rows[0]?.count || '0', 10),
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

  // --- Admin Users Management Methods ---

  async findAdminUserByUsername(username: string): Promise<AdminUserRecord | null> {
    const result = await databaseService.query<AdminUserRecord>(
      'SELECT id, username, password_hash, name, email, role, is_active, last_login_at, created_at, updated_at FROM admin_users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  async findAdminUserById(id: number | string): Promise<AdminUser | null> {
    const result = await databaseService.query<AdminUser>(
      'SELECT id, username, name, email, role, is_active, last_login_at, created_at, updated_at FROM admin_users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getAdminUsers(limit = 100, offset = 0): Promise<AdminUser[]> {
    const result = await databaseService.query<AdminUser>(
      'SELECT id, username, name, email, role, is_active, last_login_at, created_at, updated_at FROM admin_users ORDER BY id ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async countActiveAdminUsers(): Promise<number> {
    const result = await databaseService.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM admin_users WHERE is_active = true'
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async countAdminUsers(): Promise<number> {
    const result = await databaseService.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM admin_users'
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async createAdminUser(data: {
    username: string;
    password_hash: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    is_active?: boolean;
  }): Promise<AdminUser> {
    const result = await databaseService.query<AdminUser>(
      `INSERT INTO admin_users (username, password_hash, name, email, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, username, name, email, role, is_active, last_login_at, created_at, updated_at`,
      [
        data.username,
        data.password_hash,
        data.name || null,
        data.email || null,
        data.role || 'admin',
        data.is_active !== undefined ? data.is_active : true,
      ]
    );
    return result.rows[0];
  }

  async updateAdminUser(
    id: number | string,
    data: {
      name?: string | null;
      email?: string | null;
      role?: string;
      is_active?: boolean;
    }
  ): Promise<AdminUser | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(data.role);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) {
      return this.findAdminUserById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, name, email, role, is_active, last_login_at, created_at, updated_at`;
    const result = await databaseService.query<AdminUser>(query, values);
    return result.rows[0] || null;
  }

  async updateAdminUserPassword(id: number | string, passwordHash: string): Promise<boolean> {
    const result = await databaseService.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateAdminUserLastLogin(id: number | string): Promise<void> {
    await databaseService.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [id]);
  }

  async deleteAdminUser(id: number | string): Promise<boolean> {
    const result = await databaseService.query('DELETE FROM admin_users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const adminModel = new AdminModel();
