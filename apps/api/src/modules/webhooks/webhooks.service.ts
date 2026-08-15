import { spawn } from 'child_process';
import { config } from '../../config/env.js';
import { webhooksModel, WebhooksModel } from './webhooks.model.js';
import { AppError } from '../../common/middleware/error.middleware.js';

export class WebhooksService {
  constructor(private readonly model: WebhooksModel = webhooksModel) {}

  async handleDeployWebhook(token?: string) {
    if (!token || token !== config.deployCiToken) {
      throw new AppError('Unauthorized: Invalid or missing deployment token', 401);
    }

    try {
      const deploymentId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Insert deployment record
      await this.model.createDeployment(deploymentId, 'pending');

      // Insert initial log
      await this.model.addLog(deploymentId, 'Deployment process triggered via CI webhook');

      // Construct redeploy command
      const command = config.redeployScript
        .replace(/\${deployment_id}/g, deploymentId)
        .replace(/\$deployment_id/g, deploymentId);

      // Spawn detached process
      const child = spawn(command, {
        shell: true,
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd(),
      });
      child.unref();

      return {
        status: 'success',
        deployment_id: deploymentId,
        message: 'Deployment process initiated successfully',
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error('[WebhooksService] handleDeployWebhook error:', err);
      throw new AppError('Failed to initiate deployment process', 500);
    }
  }
}

export const webhooksService = new WebhooksService();
