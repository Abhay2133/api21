import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { config } from '../../config/env.js';
import { DatabaseService } from '../../core/database/database.service.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async handleDeployWebhook(token?: string) {
    if (!token || token !== config.deployCiToken) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Unauthorized: Invalid or missing deployment token',
      });
    }

    try {
      const deploymentId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Insert deployment record
      await this.databaseService.query(
        'INSERT INTO deployments (id, status, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [deploymentId, 'pending']
      );

      // Insert initial log
      await this.databaseService.query(
        'INSERT INTO deployment_logs (deployment_id, message, created_at) VALUES ($1, $2, NOW())',
        [deploymentId, 'Deployment process triggered via CI webhook']
      );

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
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('handleDeployWebhook error:', err);
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Failed to initiate deployment process',
      });
    }
  }
}
