import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type { User, ApiResponse } from '@apps21/types';

// Load environment configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port and target API configuration
export const PORT = parseInt(process.env.PORT || '3001', 10);
export const API_URL = process.env.API_URL || 'http://localhost:5000';
export const WS_URL = process.env.WS_URL || 'ws://localhost:5000/ws/chat';

// Legacy / Monorepo compatibility exports
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

// Locate public assets directory
function resolvePublicDir(): string {
  const candidates = [
    path.resolve(__dirname, '../public'), // From src/ or dist/ -> apps/chat/public
    path.resolve(__dirname, 'public'),
    path.resolve(process.cwd(), 'apps/chat/public'),
    path.resolve(process.cwd(), 'public'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.resolve(__dirname, '../public');
}

export const publicDir = resolvePublicDir();

// Initialize Express Application
export const app = express();
export const server = http.createServer(app);

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic Runtime Configuration Script
app.get('/config.js', (_req, res) => {
  res.type('application/javascript');
  const clientConfig = {
    apiUrl: API_URL,
    wsUrl: WS_URL,
    port: PORT,
  };
  res.send(`window.__APP_CONFIG__ = ${JSON.stringify(clientConfig)};`);
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: '@apps21/chat',
    port: PORT,
    apiUrl: API_URL,
    wsUrl: WS_URL,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Reverse Proxy for /api/v1/chat to guarantee seamless cross-origin and single-port access
app.use('/api/v1/chat', async (req, res) => {
  try {
    const targetUrl = new URL(req.originalUrl, API_URL);
    const headers: Record<string, string> = {};

    for (const [key, val] of Object.entries(req.headers)) {
      if (key !== 'host' && typeof val === 'string') {
        headers[key] = val;
      }
    }

    if (!headers['x-forwarded-for']) {
      const remoteIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      headers['x-forwarded-for'] = remoteIp;
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      init.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const apiRes = await fetch(targetUrl.toString(), init);
    res.status(apiRes.status);

    apiRes.headers.forEach((val, key) => {
      if (key !== 'transfer-encoding' && key !== 'content-encoding') {
        res.setHeader(key, val);
      }
    });

    const buffer = await apiRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[ChatProxy] Error forwarding request to API:', err.message);
    res.status(502).json({
      status: 'error',
      message: `Failed to reach backend API service at ${API_URL}`,
    });
  }
});

// Serve Static Frontend Assets
app.use(express.static(publicDir));

// Fallback index.html route for SPA navigation
app.get('*', (_req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('apps21 Chat Client: index.html not found');
  }
});

// WebSocket Upgrade Forwarding for /ws/chat
server.on('upgrade', (req, clientSocket, head) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/ws/chat' || url.pathname === '/api/v1/chat/ws') {
    try {
      const apiUrlParsed = new URL(API_URL);
      const targetPort = parseInt(
        apiUrlParsed.port || (apiUrlParsed.protocol === 'https:' ? '443' : '80'),
        10
      );
      const targetHost = apiUrlParsed.hostname || 'localhost';

      const proxySocket = net.connect(targetPort, targetHost, () => {
        const rawHeaders = Object.entries(req.headers)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\r\n');

        proxySocket.write(`${req.method} ${req.url} HTTP/1.1\r\n${rawHeaders}\r\n\r\n`);
        if (head && head.length > 0) {
          proxySocket.write(head);
        }

        proxySocket.pipe(clientSocket);
        clientSocket.pipe(proxySocket);
      });

      proxySocket.on('error', (err) => {
        console.warn('[ChatProxy] WebSocket proxy socket error:', err.message);
        clientSocket.destroy();
      });

      clientSocket.on('error', (err) => {
        console.warn('[ChatProxy] Client WebSocket socket error:', err.message);
        proxySocket.destroy();
      });
    } catch (err: any) {
      console.error('[ChatProxy] Upgrade error:', err.message);
      clientSocket.destroy();
    }
  } else {
    clientSocket.destroy();
  }
});

// Start Server Routine
export function startServer(port: number = PORT): http.Server {
  return server.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`  apps21 // Global Web Chat`);
    console.log(`  Listening on: http://localhost:${port}`);
    console.log(`  Backend API:  ${API_URL}`);
    console.log(`  WebSocket:    ${WS_URL}`);
    console.log(`  Static Root:  ${publicDir}`);
    console.log(`==================================================\n`);
  });
}

// Auto-start when executed directly
const isDirectExecution = Boolean(
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
   process.argv[1].endsWith('dist/index.js') ||
   process.argv[1].endsWith('src/index.ts'))
);

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer(PORT);
}
