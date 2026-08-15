import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name and email are required fields' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'Name and email are required fields' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}
