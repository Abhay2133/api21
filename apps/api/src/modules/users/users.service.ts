import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<User[]> {
    try {
      const result = await this.databaseService.query<User>(
        'SELECT id, name, email, created_at, updated_at FROM users ORDER BY id ASC'
      );
      return result.rows;
    } catch (err: any) {
      this.logger.error('findAll users error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to fetch users' });
    }
  }

  async findById(id: number | string): Promise<User> {
    try {
      const result = await this.databaseService.query<User>(
        'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundException({ status: 'error', message: 'User not found' });
      }

      return result.rows[0];
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error('findById error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to fetch user' });
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    try {
      const result = await this.databaseService.query<User>(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at, updated_at',
        [dto.name, dto.email]
      );

      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException({ status: 'error', message: 'User with this email already exists' });
      }
      this.logger.error('createUser error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to create user' });
    }
  }

  async delete(id: number | string): Promise<{ status: string; message: string }> {
    try {
      const result = await this.databaseService.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundException({ status: 'error', message: 'User not found' });
      }

      return {
        status: 'success',
        message: `User ${id} deleted successfully`,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error('deleteUser error:', err);
      throw new InternalServerErrorException({ status: 'error', message: 'Failed to delete user' });
    }
  }
}
