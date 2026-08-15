export interface SystemCpuMetrics {
  model: string;
  cores: number;
  usagePercent: number;
  loadAvg: {
    '1m': number;
    '5m': number;
    '15m': number;
  };
}

export interface SystemMemoryMetrics {
  totalMB: number;
  usedMB: number;
  freeMB: number;
  usagePercent: number;
}

export interface SystemDiskMetrics {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usagePercent: number;
}

export interface SystemMetricsResponse {
  host: {
    hostname: string;
    platform: string;
    arch: string;
    nodeVersion: string;
    uptimeSeconds: number;
  };
  cpu: SystemCpuMetrics;
  memory: SystemMemoryMetrics;
  disk: SystemDiskMetrics;
  process: {
    pid: number;
    uptime: number;
    rssMB: number;
    heapUsedMB: number;
  };
  uptime: number;
}

export interface AdminLoginResponse {
  csrfToken: string;
  user: {
    username: string;
    role?: string;
    name?: string | null;
  };
}

export interface AdminDeploymentItem {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminDeploymentLogItem {
  id: number;
  deployment_id: string;
  message: string;
  created_at: string;
}

export interface AdminUser {
  id: number | string;
  username: string;
  name?: string | null;
  email?: string | null;
  role: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminUserDto {
  username: string;
  password: string;
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateAdminUserDto {
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

export interface ResetAdminUserPasswordDto {
  password: string;
}
