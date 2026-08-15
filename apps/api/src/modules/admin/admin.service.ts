import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { adminModel, AdminModel, DeploymentItem, DeploymentLogItem } from './admin.model.js';
import { config } from '../../config/env.js';
import { AppError } from '../../common/middleware/error.middleware.js';
import { jobsService } from '../jobs/jobs.service.js';
import { redisService } from '../../core/redis/redis.service.js';
import { CreateAdminUserDto, UpdateAdminUserDto } from '@api21/types';

// In-memory store for single-use terminal connection tickets (30-second expiry)
const terminalTickets = new Map<string, { token: string; expiresAt: number }>();

function safeCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export class AdminService {
  constructor(private readonly model: AdminModel = adminModel) {}

  async login(username?: string, password?: string, ip = '127.0.0.1', userAgent = 'Unknown') {
    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    let authenticatedUser: { id: number | string; username: string; role: string; name?: string | null } | null = null;

    // 1. Try Authenticating via PostgreSQL database admin_users table
    try {
      const dbUser = await this.model.findAdminUserByUsername(username);
      if (dbUser) {
        if (!dbUser.is_active) {
          throw new AppError('Account is deactivated. Contact system administrator.', 403);
        }

        const isMatch = await bcrypt.compare(password, dbUser.password_hash);
        if (isMatch) {
          await this.model.updateAdminUserLastLogin(dbUser.id);
          authenticatedUser = {
            id: dbUser.id,
            username: dbUser.username,
            role: dbUser.role,
            name: dbUser.name,
          };
        }
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.warn(`[Admin Auth] Database lookup warning: ${err.message}`);
    }

    // 2. Master Credentials Fallback (Env variables: ADMIN_USER / ADMIN_PASS / ADMIN_SECRET)
    if (!authenticatedUser) {
      const [expectedUser, expectedPass] = config.masterCredentials.split(':');
      const secretPass = process.env.ADMIN_SECRET || 'securepassword';

      const isValidUser = safeCompare(username, expectedUser || 'admin');
      const isValidPass = safeCompare(password, expectedPass || 'securepassword') || safeCompare(password, secretPass);

      if (isValidUser && isValidPass) {
        authenticatedUser = {
          id: 'root',
          username,
          role: 'superadmin',
          name: 'Root Administrator',
        };
      }
    }

    if (!authenticatedUser) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate cryptographically secure token & CSRF token
    const token = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(24).toString('hex');
    const sessionHash = crypto.createHash('sha256').update(`${token}:${username}`).digest('hex');

    const session = await this.model.createAdminSession(token, username, ip, userAgent, sessionHash);

    return {
      token: session.token,
      csrfToken,
      user: {
        id: authenticatedUser.id,
        username: authenticatedUser.username,
        role: authenticatedUser.role,
        name: authenticatedUser.name,
      },
    };
  }

  async logout(token: string) {
    if (!token) return { success: true };
    await this.model.revokeSession(token);
    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(token: string) {
    const session = await this.model.findSessionByToken(token);
    if (!session) {
      throw new AppError('Unauthorized or expired session', 401);
    }

    // Check if database user info is available
    let role = 'admin';
    let name: string | null = null;
    try {
      if (session.username) {
        const dbUser = await this.model.findAdminUserByUsername(session.username);
        if (dbUser) {
          role = dbUser.role;
          name = dbUser.name ?? null;
        } else if (session.username === (config.masterCredentials.split(':')[0] || 'admin')) {
          role = 'superadmin';
          name = 'Root Administrator';
        }
      }
    } catch {}

    return {
      id: session.id,
      username: session.username,
      role,
      name,
      ip_address: session.ip_address,
      created_at: session.created_at,
    };
  }

  // --- Admin Users CRUD & Actions ---

  async getAdminUsers(limit = 100, offset = 0) {
    return this.model.getAdminUsers(limit, offset);
  }

  async getAdminUserById(id: number | string) {
    const user = await this.model.findAdminUserById(id);
    if (!user) {
      throw new AppError('Admin user not found', 404);
    }
    return user;
  }

  async createAdminUser(dto: CreateAdminUserDto) {
    if (!dto.username || !dto.password) {
      throw new AppError('Username and password are required', 400);
    }

    const trimmedUsername = dto.username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      throw new AppError('Username must be at least 3 characters long', 400);
    }
    if (dto.password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    const existing = await this.model.findAdminUserByUsername(trimmedUsername);
    if (existing) {
      throw new AppError('An admin user with this username already exists', 409);
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = await this.model.createAdminUser({
      username: trimmedUsername,
      password_hash,
      name: dto.name?.trim(),
      email: dto.email?.trim().toLowerCase(),
      role: dto.role || 'admin',
      is_active: dto.is_active !== undefined ? dto.is_active : true,
    });

    return user;
  }

  async updateAdminUser(id: number | string, dto: UpdateAdminUserDto) {
    const user = await this.model.findAdminUserById(id);
    if (!user) {
      throw new AppError('Admin user not found', 404);
    }

    const updated = await this.model.updateAdminUser(id, {
      name: dto.name !== undefined ? dto.name?.trim() : undefined,
      email: dto.email !== undefined ? dto.email?.trim().toLowerCase() : undefined,
      role: dto.role,
      is_active: dto.is_active,
    });

    return updated;
  }

  async resetAdminUserPassword(id: number | string, newPassword?: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    const user = await this.model.findAdminUserById(id);
    if (!user) {
      throw new AppError('Admin user not found', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.model.updateAdminUserPassword(id, passwordHash);

    return { success: true, message: `Password for admin user '${user.username}' reset successfully.` };
  }

  async deleteAdminUser(id: number | string) {
    const user = await this.model.findAdminUserById(id);
    if (!user) {
      throw new AppError('Admin user not found', 404);
    }

    const success = await this.model.deleteAdminUser(id);
    if (!success) {
      throw new AppError('Failed to delete admin user', 500);
    }

    return { success: true, message: `Admin user '${user.username}' deleted successfully.` };
  }

  async toggleAdminUserStatus(id: number | string) {
    const user = await this.model.findAdminUserById(id);
    if (!user) {
      throw new AppError('Admin user not found', 404);
    }

    const updated = await this.model.updateAdminUser(id, {
      is_active: !user.is_active,
    });

    return updated;
  }

  // --- Metrics & Telemetry ---

  async getSystemMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    const idlePercent = totalTick > 0 ? (totalIdle / totalTick) * 100 : 0;
    const cpuUsagePercent = Math.max(0, Math.min(100, Math.round((100 - idlePercent) * 10) / 10));

    let diskStats = {
      totalGB: 50,
      usedGB: 15,
      freeGB: 35,
      usagePercent: 30,
    };

    try {
      if (typeof fs.statfsSync === 'function') {
        const stats = fs.statfsSync('/');
        const total = stats.bsize * stats.blocks;
        const free = stats.bsize * stats.bfree;
        const used = total - free;
        diskStats = {
          totalGB: Math.round((total / (1024 * 1024 * 1024)) * 10) / 10,
          usedGB: Math.round((used / (1024 * 1024 * 1024)) * 10) / 10,
          freeGB: Math.round((free / (1024 * 1024 * 1024)) * 10) / 10,
          usagePercent: Math.round((used / total) * 100),
        };
      }
    } catch {}

    const memoryUsage = process.memoryUsage();

    return {
      host: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptimeSeconds: os.uptime(),
      },
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        usagePercent: cpuUsagePercent,
        loadAvg: {
          '1m': Math.round(loadAvg[0] * 100) / 100,
          '5m': Math.round(loadAvg[1] * 100) / 100,
          '15m': Math.round(loadAvg[2] * 100) / 100,
        },
      },
      memory: {
        totalMB: Math.round(totalMem / (1024 * 1024)),
        usedMB: Math.round(usedMem / (1024 * 1024)),
        freeMB: Math.round(freeMem / (1024 * 1024)),
        usagePercent: Math.round((usedMem / totalMem) * 100),
      },
      disk: diskStats,
      process: {
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      },
      uptime: Math.round(process.uptime()),
    };
  }

  async getDeployments(): Promise<DeploymentItem[]> {
    return this.model.getDeployments();
  }

  async getDeploymentLogs(deploymentId: string): Promise<DeploymentLogItem[]> {
    if (!deploymentId) {
      throw new AppError('deploymentId parameter is required', 400);
    }
    return this.model.getDeploymentLogs(deploymentId);
  }

  async generateTerminalTicket(sessionToken: string): Promise<{ ticket: string; expiresIn: number }> {
    if (!sessionToken) {
      throw new AppError('Unauthorized session', 401);
    }

    const ticket = crypto.randomBytes(24).toString('hex');
    const expiresIn = 30; // 30 seconds

    try {
      const redis = redisService.getClient();
      if (redis) {
        await redis.setex(`ticket:${ticket}`, expiresIn, sessionToken);
      }
    } catch {}

    const expiresAt = Date.now() + expiresIn * 1000;
    terminalTickets.set(ticket, { token: sessionToken, expiresAt });

    return {
      ticket,
      expiresIn,
    };
  }

  validateTerminalTicket(ticket: string): boolean {
    if (!ticket) return false;
    const item = terminalTickets.get(ticket);
    if (!item) return false;

    if (item.expiresAt < Date.now()) {
      terminalTickets.delete(ticket);
      return false;
    }

    terminalTickets.delete(ticket);
    return true;
  }

  async getSessions(limit = 100, offset = 0) {
    return this.model.getSessions(limit, offset);
  }

  async getSessionById(id: number | string) {
    const session = await this.model.getSessionById(id);
    if (!session) {
      throw new AppError('Session not found', 404);
    }
    return session;
  }

  async deactivateSession(id: number | string) {
    const success = await this.model.deactivateSessionById(id);
    if (!success) {
      throw new AppError('Failed to deactivate session or session not found', 404);
    }
    return { success: true, message: 'Session deactivated successfully' };
  }

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
