import { databaseService } from '../../core/database/database.service.js';

export interface DeploymentRecord {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class WebhooksModel {
  async createDeployment(id: string, status = 'pending'): Promise<DeploymentRecord> {
    const result = await databaseService.query<DeploymentRecord>(
      'INSERT INTO deployments (id, status, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  async addLog(deploymentId: string, message: string, level = 'info'): Promise<void> {
    await databaseService.query(
      'INSERT INTO deployment_logs (deployment_id, message, created_at) VALUES ($1, $2, NOW())',
      [deploymentId, message]
    );
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await databaseService.query(
      'UPDATE deployments SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  }
}

export const webhooksModel = new WebhooksModel();
