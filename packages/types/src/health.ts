export type ServiceHealthStatus = 'connected' | 'disconnected' | 'unhealthy';

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: ServiceHealthStatus;
    redis: ServiceHealthStatus;
    bullmq: ServiceHealthStatus;
  };
}
