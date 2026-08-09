import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDbPool } from '../config/database.js';


const generateSessionHash = (username: string, ip: string, ua: string): string => {
  const normalizedIp = ip === '::1' || ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip.trim();
  const data = [ua, normalizedIp, username].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const createSession = async (req: Request, res: Response) => {
  try {
    const { username, deactivateOthers } = req.body;
    if (!username) {
      return res.status(400).json({ status: 'error', message: 'Username is required' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const token = crypto.randomBytes(32).toString('hex');
    const sessionHash = generateSessionHash(username, ip, userAgent);

    const db = getDbPool();

    if (deactivateOthers) {
      await db.query('UPDATE sessions SET is_active = false, updated_at = NOW() WHERE username = $1', [username]);
    }

    const result = await db.query(
      `INSERT INTO sessions (token, username, ip_address, user_agent, session_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, token, username, ip_address, user_agent, session_hash, is_active, created_at, updated_at`,
      [token, username, ip, userAgent, sessionHash]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err: any) {
    console.error('[SessionController] createSession error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create session' });
  }
};

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Username query parameter is required' });
    }

    const db = getDbPool();
    const result = await db.query(
      'SELECT id, token, username, ip_address, user_agent, session_hash, is_active, created_at, updated_at FROM sessions WHERE username = $1 AND is_active = true ORDER BY created_at DESC',
      [username]
    );

    res.json({
      status: 'success',
      data: result.rows,
    });
  } catch (err: any) {
    console.error('[SessionController] getActiveSessions error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch sessions' });
  }
};

export const revokeSessionByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const db = getDbPool();
    const result = await db.query('UPDATE sessions SET is_active = false, updated_at = NOW() WHERE token = $1 RETURNING id', [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    res.json({
      status: 'success',
      message: 'Session revoked successfully',
    });
  } catch (err: any) {
    console.error('[SessionController] revokeSessionByToken error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to revoke session' });
  }
};

export const revokeSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDbPool();
    const result = await db.query('UPDATE sessions SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    res.json({
      status: 'success',
      message: `Session ${id} revoked successfully`,
    });
  } catch (err: any) {
    console.error('[SessionController] revokeSessionById error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to revoke session' });
  }
};
