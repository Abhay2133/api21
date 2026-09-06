import { Router, Request, Response, NextFunction } from 'express';
import { chatService } from './chat.service.js';
import { chatAuthMiddleware, extractClientIp } from './chat.middleware.js';
import { validateBody } from '../../common/middleware/validation.middleware.js';
import { ClaimIdentityDto, SendMessageDto, HandshakeDto } from '@apps21/types';
import { getChatOnlineCount } from './chat.ws.js';

export const chatRouter = Router();

// 1. Handshake & Guest Bootstrap
chatRouter.post(
  '/identity/handshake',
  validateBody(HandshakeDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientIp = extractClientIp(req);
      const token = req.body?.token;
      const result = await chatService.handshake(clientIp, token);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Claim / Unlock Handle with Password
chatRouter.post(
  '/identity/claim',
  chatAuthMiddleware,
  validateBody(ClaimIdentityDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientIp = extractClientIp(req);
      const result = await chatService.claimIdentity(req.chatUser!, req.body, clientIp);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }
);

// 3. Get Global Conversation Details & Online Stats
chatRouter.get('/conversations/global', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await chatService.getGlobalConversation();
    const onlineCount = getChatOnlineCount();

    res.status(200).json({
      status: 'success',
      data: {
        conversation,
        onlineCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Fetch Paginated Message History
chatRouter.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    if (isNaN(conversationId)) {
      res.status(400).json({ status: 'error', message: 'Invalid conversation ID' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const beforeId = req.query.beforeId ? parseInt(req.query.beforeId as string, 10) : undefined;

    const result = await chatService.getMessages(conversationId, { limit, beforeId });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// 5. Send Message (REST fallback)
chatRouter.post(
  '/conversations/:id/messages',
  chatAuthMiddleware,
  validateBody(SendMessageDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      if (isNaN(conversationId)) {
        res.status(400).json({ status: 'error', message: 'Invalid conversation ID' });
        return;
      }

      const clientIp = extractClientIp(req);
      const message = await chatService.sendMessage(
        req.chatUser!,
        conversationId,
        req.body.content,
        clientIp
      );

      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }
);
