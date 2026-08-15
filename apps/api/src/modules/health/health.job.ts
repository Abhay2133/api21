import { healthService } from './health.service.js';

export class HealthJob {
  static async runDiagnostics(): Promise<{ success: boolean; isHealthy: boolean; uptime: number }> {
    const health = await healthService.getHealth();
    return {
      success: true,
      isHealthy: health.status === 'healthy',
      uptime: health.uptime,
    };
  }
}
