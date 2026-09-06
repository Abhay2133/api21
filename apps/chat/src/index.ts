import type { User, Session, ApiResponse } from '@apps21/types';

export interface ChatMessage {
  id: string;
  sender: User;
  recipientId?: string;
  content: string;
  timestamp: string;
}

export function createChatMessage(sender: User, content: string): ApiResponse<ChatMessage> {
  return {
    status: 'success',
    data: {
      id: `msg-${Date.now()}`,
      sender,
      content,
      timestamp: new Date().toISOString(),
    },
  };
}

console.log('[@apps21/chat] Chat skeleton initialized and ready for development.');
