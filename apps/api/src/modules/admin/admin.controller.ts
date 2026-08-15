import { Router, Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { adminGuard } from './admin.middleware.js';

const router = Router();

// GET /api/v1/admin/summary - Dashboard statistics
router.get('/summary', adminGuard, async (_req: Request, res: Response, next: NextFunction) => {
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
