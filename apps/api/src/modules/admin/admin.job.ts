import { adminService } from './admin.service.js';

export class AdminJob {
  static async collectDailyMetrics(): Promise<{ success: boolean; collectedAt: string }> {
    const summary = await adminService.getDashboardSummary();
    console.log('[AdminJob] Daily metrics collected:', JSON.stringify(summary.stats));
    return {
      success: true,
      collectedAt: new Date().toISOString(),
    };
  }
}
