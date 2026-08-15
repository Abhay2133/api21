import type { HealthResponse, QueueMetricsResponse, ApiResponse } from '@api21/types';

export interface AdminStats {
  health: HealthResponse;
  queueMetrics: QueueMetricsResponse;
  activeSessionsCount: number;
}

export function formatAdminMetrics(stats: AdminStats): ApiResponse<AdminStats> {
  return {
    status: 'success',
    data: stats,
  };
}

console.log('[@api21/admin] Admin dashboard skeleton initialized and ready for development.');
