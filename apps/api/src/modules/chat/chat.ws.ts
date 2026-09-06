import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { chatModel } from './chat.model.js';
import { chatService, CHAT_REDIS_CHANNEL } from './chat.service.js';
import { redisService } from '../../core/redis/redis.service.js';
import { ChatUser, ChatWsClientMessage, ChatWsServerMessage } from '@apps21/types';
import type { Redis } from 'ioredis';

interface ChatWebSocketClient {
  ws: WebSocket;
  user: ChatUser;
  clientIp: string;
}

const connectedClients = new Set<ChatWebSocketClient>();
let subscriberClient: Redis | null = null;

export function getChatOnlineCount(): number {
  return connectedClients.size;
}

function broadcastToLocalClients(message: ChatWsServerMessage): void {
  const data = JSON.stringify(message);
  for (const client of connectedClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
      } catch (err) {
        console.warn('[ChatWS] Error sending message to client:', err);
      }
    }
  }
}

function broadcastPresence(): void {
  broadcastToLocalClients({
    type: 'PRESENCE_UPDATE',
    payload: { onlineCount: connectedClients.size },
  });
}

function setupRedisSubscriber(): void {
  if (subscriberClient) return;

  const baseClient = redisService.getClient();
  if (!baseClient || baseClient.status !== 'ready') return;

  try {
    subscriberClient = baseClient.duplicate();
    subscriberClient.subscribe(CHAT_REDIS_CHANNEL, (err) => {
      if (err) {
        console.warn('[ChatWS] Failed to subscribe to Redis chat channel:', err);
        try {
          subscriberClient?.disconnect();
        } catch (_) {}
        subscriberClient = null;
      } else {
        console.log(`[ChatWS] Subscribed to Redis channel ${CHAT_REDIS_CHANNEL}`);
      }
    });

    subscriberClient.on('message', (channel, messageStr) => {
      if (channel === CHAT_REDIS_CHANNEL) {
        try {
          const parsed = JSON.parse(messageStr);
          broadcastToLocalClients(parsed);
        } catch (err) {
          console.error('[ChatWS] Error parsing Redis chat message:', err);
        }
      }
    });

    subscriberClient.on('error', (err) => {
      console.warn('[ChatWS] Redis subscriber warning:', err.message);
    });
  } catch (err) {
    console.warn('[ChatWS] Redis subscriber initialization skipped:', err);
  }
}

export function closeChatWebSocket(): void {
  if (subscriberClient) {
    try {
      subscriberClient.disconnect();
    } catch (_) {}
    subscriberClient = null;
  }
}

export function setupChatWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // Initialize Redis subscriber when server starts
  setupRedisSubscriber();

  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/ws/chat' || url.pathname === '/api/v1/chat/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket, request: any) => {
    const url = new URL(request?.url || '', `http://${request?.headers?.host || 'localhost'}`);
    const token = url.searchParams.get('token') || undefined;

    // Resolve client IP
    const forwarded = request.headers['x-forwarded-for'];
    let clientIp = '127.0.0.1';
    if (typeof forwarded === 'string') {
      clientIp = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      clientIp = forwarded[0].trim();
    } else if (request.socket?.remoteAddress) {
      clientIp = request.socket.remoteAddress;
    }

    let user: ChatUser;
    try {
      const handshakeResult = await chatService.handshake(clientIp, token);
      user = handshakeResult.user;
    } catch (err) {
      console.error('[ChatWS] Error resolving user during handshake:', err);
      // Fallback guest profile
      user = {
        id: 0,
        device_token: token || 'guest-fallback',
        ip_address: clientIp,
        display_name: 'Guest',
        is_claimed: false,
      };
    }

    const client: ChatWebSocketClient = { ws, user, clientIp };
    connectedClients.add(client);

    console.log(
      `[ChatWS] Client connected: ${user.display_name} (${user.ip_address}) [Total: ${connectedClients.size}]`
    );

    // Ensure Redis subscriber is running
    setupRedisSubscriber();

    // Send initial session payload
    const globalConv = await chatModel.getGlobalConversation().catch(() => null);
    ws.send(
      JSON.stringify({
        type: 'INIT',
        payload: {
          user,
          conversation: globalConv,
          onlineCount: connectedClients.size,
        },
      })
    );

    // Broadcast updated presence to all clients
    broadcastPresence();

    ws.on('message', async (data) => {
      try {
        const raw = data.toString();
        const message: ChatWsClientMessage = JSON.parse(raw);

        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        if (message.type === 'SEND_MESSAGE' && message.payload) {
          const content = String(message.payload.content || '').trim();
          if (!content) return;

          const convId =
            message.payload.conversationId || (globalConv ? globalConv.id : 1);

          // Persist message & publish to Redis
          const savedMessage = await chatService.sendMessage(user, convId, content, clientIp);

          // If Redis subscriber is not ready or redis is disconnected, broadcast directly to local clients as fallback
          if (!subscriberClient || subscriberClient.status !== 'ready' || !redisService.isConnected) {
            broadcastToLocalClients({
              type: 'NEW_MESSAGE',
              payload: savedMessage,
            });
          }
        }
      } catch (err: any) {
        console.error('[ChatWS] Error handling client message:', err);
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            payload: { message: err.message || 'Failed to process message' },
          })
        );
      }
    });

    const cleanup = () => {
      connectedClients.delete(client);
      broadcastPresence();
      console.log(
        `[ChatWS] Client disconnected: ${user.display_name} [Total: ${connectedClients.size}]`
      );
    };

    ws.on('close', cleanup);
    ws.on('error', (err) => {
      console.error('[ChatWS] WebSocket error:', err);
      cleanup();
    });
  });

  return wss;
}
