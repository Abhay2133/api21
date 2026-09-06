import { CreateUserDto, User } from '@apps21/types';
import { usersModel, UsersModel } from './users.model.js';
import { AppError } from '../../common/middleware/error.middleware.js';

export class UsersService {
  constructor(private readonly model: UsersModel = usersModel) {}

  async getAllUsers(): Promise<User[]> {
    return this.model.findAll();
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.model.findById(id);
    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.model.findByEmail(dto.email);
    if (existing) {
      throw new AppError(`User with email "${dto.email}" already exists`, 409);
    }
    return this.model.create(dto.name, dto.email);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const deleted = await this.model.deleteById(id);
    if (!deleted) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }
    return { success: true, message: `User with ID ${id} deleted successfully` };
  }
}

export const usersService = new UsersService();
