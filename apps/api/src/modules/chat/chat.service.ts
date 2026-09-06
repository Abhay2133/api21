import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { chatModel } from './chat.model.js';
import { redisService } from '../../core/redis/redis.service.js';
import { ChatUser, Conversation, ChatMessage, ClaimIdentityDto } from '@apps21/types';

export const CHAT_REDIS_CHANNEL = 'channel:chat:global';

export class ChatService {
  async handshake(
    clientIp: string,
    existingToken?: string
  ): Promise<{ user: ChatUser; token: string }> {
    if (existingToken) {
      const existingUser = await chatModel.findUserByDeviceToken(existingToken);
      if (existingUser) {
        // Update client IP and activity
        const updated = await chatModel.updateUser(existingUser.id, {
          ip_address: clientIp,
        });
        return {
          user: {
            id: updated.id,
            device_token: updated.device_token,
            ip_address: updated.ip_address,
            display_name: updated.display_name,
            is_claimed: updated.is_claimed,
            email: updated.email,
            last_active_at: updated.last_active_at,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
          },
          token: updated.device_token,
        };
      }
    }

    // Generate new guest session
    const newToken = crypto.randomUUID();
    const guestSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const displayName = `Guest-${guestSuffix}`;

    const newUser = await chatModel.createUser({
      device_token: newToken,
      ip_address: clientIp,
      display_name: displayName,
      is_claimed: false,
    });

    return {
      user: newUser,
      token: newUser.device_token,
    };
  }

  async claimIdentity(
    currentUser: ChatUser,
    dto: ClaimIdentityDto,
    clientIp: string
  ): Promise<{ user: ChatUser; token: string }> {
    const trimmedName = dto.displayName.trim();
    const existingNameUser = await chatModel.findUserByDisplayName(trimmedName);

    if (existingNameUser) {
      // 1. If name is already claimed
      if (existingNameUser.is_claimed) {
        if (!existingNameUser.password_hash) {
          throw new Error('This display name is unavailable.');
        }

        const isMatch = await bcrypt.compare(dto.password, existingNameUser.password_hash);
        if (!isMatch) {
          const err: any = new Error(
            'This handle is password-protected. The password entered is incorrect.'
          );
          err.statusCode = 401;
          throw err;
        }

        // Successfully authenticated to existing claimed profile!
        // Free device_token from the temporary guest account if distinct to avoid unique constraint collision
        if (currentUser.id !== existingNameUser.id) {
          await chatModel.updateUser(currentUser.id, {
            device_token: crypto.randomUUID(),
          });
        }

        // Link this device's token to the claimed account
        const updatedClaimed = await chatModel.updateUser(existingNameUser.id, {
          device_token: currentUser.device_token,
          ip_address: clientIp,
        });

        return {
          user: {
            id: updatedClaimed.id,
            device_token: updatedClaimed.device_token,
            ip_address: updatedClaimed.ip_address,
            display_name: updatedClaimed.display_name,
            is_claimed: updatedClaimed.is_claimed,
            email: updatedClaimed.email,
            last_active_at: updatedClaimed.last_active_at,
            created_at: updatedClaimed.created_at,
            updated_at: updatedClaimed.updated_at,
          },
          token: updatedClaimed.device_token,
        };
      } else if (existingNameUser.id !== currentUser.id) {
        // Unclaimed guest with that name. We allow the current user to claim it with a password.
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const updated = await chatModel.updateUser(currentUser.id, {
          display_name: trimmedName,
          is_claimed: true,
          password_hash: passwordHash,
          ip_address: clientIp,
        });

        return { user: updated, token: updated.device_token };
      }
    }

    // 2. Fresh claim for current user
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const updated = await chatModel.updateUser(currentUser.id, {
      display_name: trimmedName,
      is_claimed: true,
      password_hash: passwordHash,
      ip_address: clientIp,
    });

    return {
      user: {
        id: updated.id,
        device_token: updated.device_token,
        ip_address: updated.ip_address,
        display_name: updated.display_name,
        is_claimed: updated.is_claimed,
        email: updated.email,
        last_active_at: updated.last_active_at,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
      token: updated.device_token,
    };
  }

  async getGlobalConversation(): Promise<Conversation> {
    return chatModel.getGlobalConversation();
  }

  async getMessages(
    conversationId: number,
    options: { limit?: number; beforeId?: number } = {}
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    const limit = Math.min(Math.max(options.limit || 50, 1), 100);
    const messages = await chatModel.getMessagesByConversation(conversationId, {
      limit: limit + 1,
      beforeId: options.beforeId,
    });

    const hasMore = messages.length > limit;
    const finalMessages = hasMore ? messages.slice(1) : messages;

    return {
      messages: finalMessages,
      hasMore,
    };
  }

  async sendMessage(
    user: ChatUser,
    conversationId: number,
    content: string,
    clientIp: string
  ): Promise<ChatMessage> {
    const trimmed = content.trim();
    if (!trimmed) {
      const err: any = new Error('Message cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    if (trimmed.length > 2000) {
      const err: any = new Error('Message cannot exceed 2000 characters');
      err.statusCode = 400;
      throw err;
    }

    const message = await chatModel.createMessage({
      conversation_id: conversationId,
      user_id: user.id,
      sender_name: user.display_name,
      sender_ip: clientIp,
      content: trimmed,
      message_type: 'text',
    });

    // Publish to Redis Pub/Sub for multi-process / cluster WebSocket broadcast
    try {
      const redis = redisService.getClient();
      if (redis && redisService.isConnected && redis.status === 'ready') {
        await redis.publish(
          CHAT_REDIS_CHANNEL,
          JSON.stringify({
            type: 'NEW_MESSAGE',
            payload: message,
          })
        );
      }
    } catch (pubErr) {
      console.warn('[ChatService] Redis publish error:', pubErr);
    }

    return message;
  }
}

export const chatService = new ChatService();
