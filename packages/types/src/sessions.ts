import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  username!: string;

  @IsOptional()
  @IsBoolean()
  deactivateOthers?: boolean;
}

export interface Session {
  id: number;
  user_id?: number | null;
  username?: string;
  token: string;
  is_active: boolean;
  expires_at: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
}
