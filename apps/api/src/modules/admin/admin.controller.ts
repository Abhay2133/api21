import { Router, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { adminGuard, AdminRequest } from './admin.middleware.js';

const router = Router();

// POST /api/v1/admin/login - Authenticate admin credentials
router.post('/login', async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body || {};
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const data = await adminService.login(username, password, ip, userAgent);

    // Set HttpOnly session cookie and csrf_token cookie
    res.setHeader('Set-Cookie', [
      `admin_session=${data.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `csrf_token=${data.csrfToken}; Path=/; SameSite=Lax; Max-Age=86400`,
    ]);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/logout - Clear session
router.post('/logout', async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    await adminService.logout(token);

    res.setHeader('Set-Cookie', [
      'admin_session=; Path=/; HttpOnly; Max-Age=0',
      'csrf_token=; Path=/; Max-Age=0',
    ]);

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/me - Verify session and get admin profile
router.get('/me', adminGuard, async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const session = req.adminSession!;
    return res.status(200).json({
      status: 'success',
      data: {
        id: session.id,
        username: session.username,
        ip_address: session.ip_address,
        created_at: session.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/system-metrics - Host CPU, RAM, Disk, and Process stats
router.get('/system-metrics', adminGuard, async (_req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getSystemMetrics();
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/deployments - Query deployments history
router.get('/deployments', adminGuard, async (_req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDeployments();
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/deployments/:id/logs - Query logs for specific deployment
router.get('/deployments/:id/logs', adminGuard, async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDeploymentLogs(req.params.id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/terminal/ticket - Generate single-use ticket for WebSocket terminal connection
router.post('/terminal/ticket', adminGuard, async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.adminSession?.token || 'session-token';
    const data = await adminService.generateTerminalTicket(token);
    return res.status(201).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/summary - Dashboard statistics
router.get('/summary', adminGuard, async (_req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDashboardSummary();
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

export const adminRouter = router;
