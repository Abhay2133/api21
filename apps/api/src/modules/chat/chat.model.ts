import { databaseService } from '../../core/database/database.service.js';
import { ChatUser, Conversation, ChatMessage } from '@apps21/types';

export class ChatModel {
  async findUserByDeviceToken(deviceToken: string): Promise<(ChatUser & { password_hash?: string }) | null> {
    const result = await databaseService.query<ChatUser & { password_hash?: string }>(
      `SELECT id, device_token, ip_address, display_name, is_claimed, password_hash, email, last_active_at, created_at, updated_at
       FROM users
       WHERE device_token = $1
       LIMIT 1`,
      [deviceToken]
    );
    return result.rows[0] || null;
  }

  async findUserByDisplayName(displayName: string): Promise<(ChatUser & { password_hash?: string }) | null> {
    const result = await databaseService.query<ChatUser & { password_hash?: string }>(
      `SELECT id, device_token, ip_address, display_name, is_claimed, password_hash, email, last_active_at, created_at, updated_at
       FROM users
       WHERE LOWER(display_name) = LOWER($1)
       LIMIT 1`,
      [displayName]
    );
    return result.rows[0] || null;
  }

  async findUserById(id: number): Promise<(ChatUser & { password_hash?: string }) | null> {
    const result = await databaseService.query<ChatUser & { password_hash?: string }>(
      `SELECT id, device_token, ip_address, display_name, is_claimed, password_hash, email, last_active_at, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createUser(data: {
    device_token: string;
    ip_address: string;
    display_name: string;
    is_claimed?: boolean;
    password_hash?: string | null;
  }): Promise<ChatUser> {
    const result = await databaseService.query<ChatUser>(
      `INSERT INTO users (device_token, ip_address, display_name, is_claimed, password_hash, last_active_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, device_token, ip_address, display_name, is_claimed, email, last_active_at, created_at, updated_at`,
      [
        data.device_token,
        data.ip_address,
        data.display_name,
        data.is_claimed ?? false,
        data.password_hash || null,
      ]
    );
    return result.rows[0];
  }

  async updateUser(
    id: number,
    data: {
      display_name?: string;
      is_claimed?: boolean;
      password_hash?: string | null;
      ip_address?: string;
      device_token?: string;
    }
  ): Promise<ChatUser> {
    const updates: string[] = ['updated_at = NOW()', 'last_active_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(data.display_name);
    }
    if (data.is_claimed !== undefined) {
      updates.push(`is_claimed = $${paramIndex++}`);
      values.push(data.is_claimed);
    }
    if (data.password_hash !== undefined) {
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(data.password_hash);
    }
    if (data.ip_address !== undefined) {
      updates.push(`ip_address = $${paramIndex++}`);
      values.push(data.ip_address);
    }
    if (data.device_token !== undefined) {
      updates.push(`device_token = $${paramIndex++}`);
      values.push(data.device_token);
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, device_token, ip_address, display_name, is_claimed, email, last_active_at, created_at, updated_at
    `;

    const result = await databaseService.query<ChatUser>(query, values);
    return result.rows[0];
  }

  async updateLastActive(id: number): Promise<void> {
    await databaseService.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [id]);
  }

  async getGlobalConversation(): Promise<Conversation> {
    let result = await databaseService.query<Conversation>(
      "SELECT id, slug, title, type, metadata, is_active, created_at, updated_at FROM conversations WHERE slug = 'global' LIMIT 1"
    );

    if (result.rows.length === 0) {
      // Seed if missing
      result = await databaseService.query<Conversation>(
        `INSERT INTO conversations (slug, title, type, metadata, is_active)
         VALUES ('global', 'Global Chat', 'global', '{"description":"Public global chat room"}'::jsonb, true)
         RETURNING id, slug, title, type, metadata, is_active, created_at, updated_at`
      );
    }

    return result.rows[0];
  }

  async getConversationById(id: number): Promise<Conversation | null> {
    const result = await databaseService.query<Conversation>(
      'SELECT id, slug, title, type, metadata, is_active, created_at, updated_at FROM conversations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async createMessage(data: {
    conversation_id: number;
    user_id?: number | null;
    sender_name: string;
    sender_ip: string;
    content: string;
    message_type?: string;
    metadata?: any;
  }): Promise<ChatMessage> {
    const result = await databaseService.query<ChatMessage>(
      `INSERT INTO messages (conversation_id, user_id, sender_name, sender_ip, content, message_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, conversation_id, user_id, sender_name, sender_ip, content, message_type, metadata, created_at, updated_at`,
      [
        data.conversation_id,
        data.user_id || null,
        data.sender_name,
        data.sender_ip,
        data.content,
        data.message_type || 'text',
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getMessagesByConversation(
    conversationId: number,
    options: { limit?: number; beforeId?: number } = {}
  ): Promise<ChatMessage[]> {
    const limit = Math.min(Math.max(options.limit || 50, 1), 100);
    const params: any[] = [conversationId];
    let whereClause = 'WHERE conversation_id = $1';

    if (options.beforeId) {
      params.push(options.beforeId);
      whereClause += ` AND id < $${params.length}`;
    }

    params.push(limit);
    const query = `
      SELECT id, conversation_id, user_id, sender_name, sender_ip, content, message_type, metadata, created_at, updated_at
      FROM messages
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${params.length}
    `;

    const result = await databaseService.query<ChatMessage>(query, params);
    // Return in chronological order for UI display
    return result.rows.reverse();
  }
}

export const chatModel = new ChatModel();
