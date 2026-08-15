import { databaseService } from '../../core/database/database.service.js';

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
}

export const adminModel = new AdminModel();
