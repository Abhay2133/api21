import { Request, Response } from 'express';
import { getDbPool } from '../infrastructure/database.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const db = getDbPool();
    const result = await db.query('SELECT id, name, email, created_at, updated_at FROM users ORDER BY id ASC');
    res.json({
      status: 'success',
      data: result.rows,
    });
  } catch (err: any) {
    console.error('[UserController] getUsers error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDbPool();
    const result = await db.query('SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err: any) {
    console.error('[UserController] getUserById error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required fields' });
    }

    const db = getDbPool();
    const result = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at, updated_at',
      [name, email]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'User with this email already exists' });
    }
    console.error('[UserController] createUser error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDbPool();
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({
      status: 'success',
      message: `User ${id} deleted successfully`,
    });
  } catch (err: any) {
    console.error('[UserController] deleteUser error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete user' });
  }
};
