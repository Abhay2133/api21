import { Router } from 'express';
import { createSession, getActiveSessions, revokeSessionByToken, revokeSessionById } from '../controllers/sessionController.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router: Router = Router();

router.post('/', createSession);
router.get('/', getActiveSessions);
router.delete('/token/:token', adminAuthMiddleware, revokeSessionByToken);
router.delete('/id/:id', adminAuthMiddleware, revokeSessionById);

export default router;
