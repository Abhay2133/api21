import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { adminService } from './admin.service.js';
import { adminModel } from './admin.model.js';
import { redisService } from '../../core/redis/redis.service.js';

export function setupTerminalWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    
    if (url.pathname === '/ws/admin/terminal' || url.pathname === '/api/v1/admin/terminal/ws') {
      const ticket = url.searchParams.get('ticket');
      const token = url.searchParams.get('token');

      let isAuthorized = false;

      // 1. Verify single-use ticket in Redis
      if (ticket) {
        try {
          const redis = redisService.getClient();
          if (redis) {
            const savedToken = await redis.get(`ticket:${ticket}`);
            if (savedToken) {
              await redis.del(`ticket:${ticket}`);
              isAuthorized = true;
            }
          }
        } catch {}

        if (!isAuthorized && adminService.validateTerminalTicket(ticket)) {
          isAuthorized = true;
        }
      }

      // 2. Fallback: verify active admin session token in PostgreSQL
      if (!isAuthorized && token) {
        try {
          const session = await adminModel.findSessionByToken(token);
          if (session) {
            isAuthorized = true;
          }
        } catch {}
      }

      if (!isAuthorized) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, request: any) => {
    const url = new URL(request?.url || '', `http://${request?.headers?.host || 'localhost'}`);
    const initialCols = Math.max(10, parseInt(url.searchParams.get('cols') || '100', 10));
    const initialRows = Math.max(5, parseInt(url.searchParams.get('rows') || '30', 10));

    console.log(`[TerminalWS] Client connected to real node-pty shell (${initialCols}x${initialRows})`);

    const shell = process.env.SHELL || '/bin/bash';
    let ptyProcess: pty.IPty | null = null;
    let currentCols = initialCols;
    let currentRows = initialRows;

    try {
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: initialCols,
        rows: initialRows,
        cwd: process.cwd(),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        } as { [key: string]: string },
      });
    } catch (err) {
      console.error('[TerminalWS] Failed to spawn PTY process:', err);
      ws.send(`\r\n\x1b[31mFailed to spawn terminal process: ${err}\x1b[0m\r\n`);
      ws.close();
      return;
    }

    // Direct PTY data output streaming
    ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    ws.on('message', (message) => {
      try {
        const str = message.toString();

        // Check for control / resize frames
        if (str.startsWith('{') && str.endsWith('}')) {
          try {
            const parsed = JSON.parse(str);
            if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
              const newCols = Math.max(10, parsed.cols);
              const newRows = Math.max(5, parsed.rows);
              // Only resize and fire SIGWINCH when dimensions actually changed
              if (newCols !== currentCols || newRows !== currentRows) {
                currentCols = newCols;
                currentRows = newRows;
                ptyProcess?.resize(newCols, newRows);
              }
              return;
            }
            if (parsed.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }
          } catch {}
        }

        // Forward raw key/escape sequences directly to PTY (supports curses/htop/vim/Ctrl+C)
        ptyProcess?.write(str);
      } catch (err) {
        console.error('[TerminalWS] Error writing to pty:', err);
      }
    });

    const cleanup = () => {
      try {
        if (ptyProcess) {
          ptyProcess.kill();
          ptyProcess = null;
        }
      } catch {}
    };

    ptyProcess.onExit(({ exitCode }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
        ws.close();
      }
    });

    ws.on('close', () => {
      console.log('[TerminalWS] Terminal client disconnected');
      cleanup();
    });

    ws.on('error', (err) => {
      console.error('[TerminalWS] WebSocket error:', err);
      cleanup();
    });
  });

  return wss;
}
