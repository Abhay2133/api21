import { Request, Response, NextFunction } from 'express';
import { chatModel } from './chat.model.js';
import { ChatUser } from '@apps21/types';

declare global {
  namespace Express {
    interface Request {
      chatUser?: ChatUser;
    }
  }
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

export async function chatAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.headers['x-device-token'] === 'string') {
    token = req.headers['x-device-token'].trim();
  }

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication token required (provide Bearer token or X-Device-Token header)',
    });
    return;
  }

  try {
    const user = await chatModel.findUserByDeviceToken(token);
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired session token. Please perform handshake again.',
      });
      return;
    }

    req.chatUser = user;
    next();
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate chat user',
      error: err.message,
    });
  }
}
