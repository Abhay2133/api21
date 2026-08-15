import { adminModel, AdminModel } from './admin.model.js';
import { jobsService } from '../jobs/jobs.service.js';

export class AdminService {
  constructor(private readonly model: AdminModel = adminModel) {}

  async getDashboardSummary() {
    const stats = await this.model.getAdminStats();
    const queueMetrics = await jobsService.getQueueMetrics();

    return {
      stats,
      queueMetrics,
      timestamp: new Date().toISOString(),
    };
  }
}

export const adminService = new AdminService();
