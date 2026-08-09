import { Request, Response } from 'express';
import { spawn } from 'child_process';
import { config } from '../config/env.js';
import { getDbPool } from '../config/database.js';

export const handleDeployWebhook = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string | undefined;

    if (!token || token !== config.deployCiToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Invalid or missing deployment token',
      });
    }

    const deploymentId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const db = getDbPool();

    // Insert deployment record
    await db.query(
      'INSERT INTO deployments (id, status, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
      [deploymentId, 'pending']
    );

    // Insert initial log
    await db.query(
      'INSERT INTO deployment_logs (deployment_id, message, created_at) VALUES ($1, $2, NOW())',
      [deploymentId, 'Deployment process triggered via CI webhook']
    );

    // Construct redeploy command
    const command = config.redeployScript
      .replace(/\${deployment_id}/g, deploymentId)
      .replace(/\$deployment_id/g, deploymentId);

    // Spawn detached Node process
    const child = spawn(command, {
      shell: true,
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
    });
    child.unref();

    return res.status(202).json({
      status: 'success',
      deployment_id: deploymentId,
      message: 'Deployment process initiated successfully',
    });
  } catch (err: any) {
    console.error('[WebhookController] handleDeployWebhook error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to initiate deployment process',
    });
  }
};
