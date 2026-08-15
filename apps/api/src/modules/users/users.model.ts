import { databaseService } from '../../core/database/database.service.js';
import { User } from '@api21/types';

export class UsersModel {
  async findAll(): Promise<User[]> {
    const result = await databaseService.query<User>(
      'SELECT id, name, email, created_at, updated_at FROM users ORDER BY id ASC'
    );
    return result.rows;
  }

  async findById(id: number): Promise<User | null> {
    const result = await databaseService.query<User>(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await databaseService.query<User>(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(name: string, email: string): Promise<User> {
    const result = await databaseService.query<User>(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at, updated_at',
      [name, email]
    );
    return result.rows[0];
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await databaseService.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const usersModel = new UsersModel();
