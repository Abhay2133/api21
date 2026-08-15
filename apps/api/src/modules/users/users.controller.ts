import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers() {
    const data = await this.usersService.findAll();
    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return {
      status: 'success',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {
      status: 'success',
      data,
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
