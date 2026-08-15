'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { apiClient } from '../../lib/api-client';
import { Button } from '../ui/button';
import { RefreshCw, Terminal as TerminalIcon, AlertCircle, Maximize2, Minimize2, Play, SquareCode } from 'lucide-react';

export default function XTermClient() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isUnmountedRef = useRef(false);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  const sendResize = () => {
    if (xtermInstance.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const { cols, rows } = xtermInstance.current;
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  };

  const sendRawData = (data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      xtermInstance.current?.focus();
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput) return;
    sendRawData(`${quickInput}\r`);
    setQuickInput('');
  };

  const connectTerminal = async () => {
    if (isUnmountedRef.current) return;
    setStatus('connecting');
    setErrorMessage(null);

    // Close any previous WebSocket
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // 1. Get single-use connection ticket from backend (cookie authenticated)
      const res = await apiClient.post('/api/v1/admin/terminal/ticket');
      const ticket = res.data?.ticket;

      if (!ticket) {
        throw new Error('Failed to obtain terminal authorization ticket');
      }

      // 2. Resolve WebSocket endpoint URL
      const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
      const explicitApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      let wsBase = explicitWsUrl;
      if (!wsBase) {
        const isSecure = explicitApiUrl.startsWith('https');
        const host = explicitApiUrl.replace(/^https?:\/\//, '');
        wsBase = `${isSecure ? 'wss' : 'ws'}://${host}`;
      }

      const wsUrl = `${wsBase}/ws/admin/terminal?ticket=${ticket}`;

      // 3. Initialize xterm instance if not already initialized
      if (!xtermInstance.current && terminalRef.current) {
        terminalRef.current.innerHTML = '';
        const term = new XTerminal({
          cursorBlink: true,
          fontFamily: 'var(--font-mono), Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          lineHeight: 1.25,
          theme: {
            background: '#090d16',
            foreground: '#f8fafc',
            cursor: '#38bdf8',
            selectionBackground: '#1e293b',
            black: '#0f172a',
            red: '#ef4444',
            green: '#10b981',
            yellow: '#f59e0b',
            blue: '#3b82f6',
            magenta: '#ec4899',
            cyan: '#06b6d4',
            white: '#f8fafc',
          },
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        term.onData((data) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
          }
        });

        xtermInstance.current = term;
        fitAddonRef.current = fitAddon;

        // Expose global helper for automated testing and interaction
        (window as any).__xterm = term;
        (window as any).__sendTerminalInput = (input: string) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(input);
          }
        };
      }

      const term = xtermInstance.current;
      if (term) {
        term.clear();
      }

      // 4. Open WebSocket to real node-pty
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) return;
        setStatus('connected');
        if (term) {
          fitAddonRef.current?.fit();
          sendResize();
          term.focus();
        }
      };

      ws.onmessage = (event) => {
        if (term && typeof event.data === 'string') {
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        if (isUnmountedRef.current) return;
        setStatus('error');
        setErrorMessage('WebSocket connection error occurred.');
      };

      ws.onclose = (event) => {
        if (isUnmountedRef.current) return;
        setStatus('disconnected');
        if (term && !event.wasClean) {
          term.writeln('\r\n\x1b[31m[Session Disconnected]\x1b[0m\r\n');
        }
      };
    } catch (err: any) {
      if (isUnmountedRef.current) return;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to connect to web console.');
    }
  };

  useEffect(() => {
    isUnmountedRef.current = false;
    connectTerminal();

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        sendResize();
      }
    };

    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isUnmountedRef.current = true;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (xtermInstance.current) {
        xtermInstance.current.dispose();
        xtermInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        sendResize();
      }
      xtermInstance.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 bg-[#070b12] flex flex-col space-y-3'
          : 'flex flex-col h-full space-y-3'
      }
    >
      {/* Terminal Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-lg border border-slate-800/80 bg-[#0c121d] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-100 font-mono">pty://host-bash</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {status === 'connected' && (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live PTY Session Active
              </span>
            )}
            {status === 'connecting' && <span className="text-amber-400 animate-pulse">Connecting...</span>}
            {status === 'disconnected' && <span className="text-slate-400">Disconnected</span>}
            {status === 'error' && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Error
              </span>
            )}
          </div>
        </div>

        {/* Quick Commands & Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Command Shortcuts */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-0.5 rounded-md border border-slate-800/80">
            <button
              onClick={() => sendRawData('htop\r')}
              disabled={status !== 'connected'}
              className="px-2 py-1 text-xs font-mono text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded transition-colors"
              title="Launch htop monitor"
            >
              htop
            </button>
            <button
              onClick={() => sendRawData('q')}
              disabled={status !== 'connected'}
              className="px-2 py-1 text-xs font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
              title="Send 'q' key (exit htop / less)"
            >
              q (exit)
            </button>
            <button
              onClick={() => sendRawData('\x03')}
              disabled={status !== 'connected'}
              className="px-2 py-1 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              title="Send Ctrl+C"
            >
              ^C
            </button>
            <button
              onClick={() => sendRawData('clear\r')}
              disabled={status !== 'connected'}
              className="px-2 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Clear terminal screen"
            >
              clear
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 text-xs gap-1.5 border-slate-700 hover:border-slate-600 text-slate-300"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={connectTerminal}
            disabled={status === 'connecting'}
            className="h-7 text-xs gap-1.5 border-slate-700 hover:border-slate-600 text-slate-200"
          >
            <RefreshCw className={`w-3 h-3 ${status === 'connecting' ? 'animate-spin' : ''}`} />
            <span>{status === 'connected' ? 'Restart' : 'Reconnect'}</span>
          </Button>
        </div>
      </div>

      {/* Terminal Canvas Container */}
      <div
        className={`relative flex-1 w-full rounded-xl border border-slate-800/80 bg-[#090d16] p-3.5 shadow-2xl overflow-hidden ${
          isFullscreen ? 'min-h-0' : 'min-h-[550px]'
        }`}
        onClick={() => xtermInstance.current?.focus()}
      >
        {errorMessage && status === 'error' && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <h4 className="text-base font-semibold text-white mb-1">Terminal Connection Failed</h4>
            <p className="text-xs text-slate-400 max-w-md mb-4">{errorMessage}</p>
            <Button onClick={connectTerminal} size="sm">
              Retry Connection
            </Button>
          </div>
        )}
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
}
