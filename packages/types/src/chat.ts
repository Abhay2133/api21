import { IsNotEmpty, IsString, Length, Matches, IsOptional, IsInt } from 'class-validator';

export interface ChatUser {
  id: number;
  device_token: string;
  ip_address: string;
  display_name: string;
  is_claimed: boolean;
  email?: string | null;
  last_active_at?: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Conversation {
  id: number;
  slug: string;
  title: string;
  type: 'global' | 'direct' | 'group';
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ChatMessage {
  id: number | string;
  conversation_id: number;
  user_id?: number | null;
  sender_name: string;
  sender_ip?: string;
  content: string;
  message_type?: 'text' | 'system' | 'action';
  metadata?: Record<string, any>;
  created_at: string | Date;
  updated_at?: string | Date;
}

export class HandshakeDto {
  @IsOptional()
  @IsString()
  token?: string;
}

export class ClaimIdentityDto {
  @IsNotEmpty({ message: 'Display name is required' })
  @IsString()
  @Length(2, 30, { message: 'Display name must be between 2 and 30 characters' })
  @Matches(/^[\w\s\-_.]+$/, { message: 'Display name can only contain letters, numbers, spaces, and - _ .' })
  displayName!: string;

  @IsNotEmpty({ message: 'Password is required to claim a handle' })
  @IsString()
  @Length(4, 100, { message: 'Password must be between 4 and 100 characters' })
  password!: string;
}

export class SendMessageDto {
  @IsOptional()
  @IsInt()
  conversationId?: number;

  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @IsString()
  @Length(1, 2000, { message: 'Message cannot exceed 2000 characters' })
  content!: string;
}

export type ChatWsClientAction = 'SEND_MESSAGE' | 'PING' | 'TYPING';
export type ChatWsServerAction = 'INIT' | 'NEW_MESSAGE' | 'PRESENCE_UPDATE' | 'ERROR' | 'PONG';

export interface ChatWsClientMessage<T = any> {
  type: ChatWsClientAction;
  payload?: T;
}

export interface ChatWsServerMessage<T = any> {
  type: ChatWsServerAction;
  payload?: T;
}
