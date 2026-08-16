import { Router, Response, NextFunction } from 'express';
import { sessionsService } from './sessions.service.js';
import { validateCreateSession, extractClientMetadata, RequestWithClientMeta } from './sessions.middleware.js';

const router: Router = Router();

// POST /api/v1/sessions - Create new session
router.post('/', validateCreateSession, extractClientMetadata, async (req: RequestWithClientMeta, res: Response, next: NextFunction) => {
  try {
    const data = await sessionsService.createSession(
      req.body,
      req.clientIp || '127.0.0.1',
      req.clientUserAgent || 'Unknown'
    );
    return res.status(201).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sessions - List active sessions
router.get('/', async (req: RequestWithClientMeta, res: Response, next: NextFunction) => {
  try {
    const username = req.query.username as string | undefined;
    const data = await sessionsService.getActiveSessions(username);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/sessions/token/:token - Revoke session by token
router.delete('/token/:token', async (req: RequestWithClientMeta, res: Response, next: NextFunction) => {
  try {
    const data = await sessionsService.revokeSessionByToken(req.params.token);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/sessions/:id - Revoke session by ID
router.delete('/:id', async (req: RequestWithClientMeta, res: Response, next: NextFunction) => {
  try {
    const data = await sessionsService.revokeSessionById(req.params.id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
});

export const sessionsRouter: Router = router;
