import { webhooksModel } from './webhooks.model.js';

export class WebhooksJob {
  static async updateDeploymentStatus(deploymentId: string, status: string, logMessage?: string): Promise<void> {
    await webhooksModel.updateStatus(deploymentId, status);
    if (logMessage) {
      await webhooksModel.addLog(deploymentId, logMessage);
    }
  }
}
