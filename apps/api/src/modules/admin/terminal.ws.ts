import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'child_process';
import { adminService } from './admin.service.js';
import { adminModel } from './admin.model.js';

export function setupTerminalWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    
    if (url.pathname === '/ws/admin/terminal' || url.pathname === '/api/v1/admin/terminal/ws') {
      const ticket = url.searchParams.get('ticket');
      const token = url.searchParams.get('token');

      let isAuthorized = false;

      // 1. Verify single-use ticket
      if (ticket && adminService.validateTerminalTicket(ticket)) {
        isAuthorized = true;
      }

      // 2. Fallback: verify active admin session token
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

  wss.on('connection', (ws: WebSocket) => {
    console.log('[TerminalWS] Client connected to admin web terminal');

    const shell = process.env.SHELL || '/bin/bash';
    const child = spawn(shell, ['-i'], {
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
      cwd: process.cwd(),
    });

    const sendOutput = (data: Buffer | string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    };

    child.stdout.on('data', sendOutput);
    child.stderr.on('data', sendOutput);

    // Initial banner
    ws.send(`\r\n\x1b[36m====================================================\x1b[0m\r\n`);
    ws.send(`\x1b[32m  Connected to api21 Admin Web Console (${shell})\x1b[0m\r\n`);
    ws.send(`\x1b[90m  Type commands and press Enter to execute.\x1b[0m\r\n`);
    ws.send(`\x1b[36m====================================================\x1b[0m\r\n\r\n`);

    ws.on('message', (message) => {
      try {
        const str = message.toString();
        // Check if message is a control JSON frame (e.g. resize or ping)
        if (str.startsWith('{') && str.endsWith('}')) {
          try {
            const parsed = JSON.parse(str);
            if (parsed.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }
          } catch {}
        }

        if (child.stdin && !child.stdin.destroyed) {
          child.stdin.write(str);
        }
      } catch (err) {
        console.error('[TerminalWS] Error handling message:', err);
      }
    });

    const cleanup = () => {
      try {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      } catch {}
    };

    child.on('exit', (code) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n\x1b[33m[Process exited with code ${code}]\x1b[0m\r\n`);
        ws.close();
      }
    });

    ws.on('close', () => {
      console.log('[TerminalWS] Client disconnected from terminal');
      cleanup();
    });

    ws.on('error', (err) => {
      console.error('[TerminalWS] WebSocket error:', err);
      cleanup();
    });
  });

  return wss;
}
