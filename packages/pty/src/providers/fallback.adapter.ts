import { spawn as cpSpawn, ChildProcess } from 'node:child_process';
import { IPty, IPtyForkOptions, IExitEvent, IDisposable, PtyProviderType } from '../interfaces.js';
import { getDefaultShell } from '../utils/env-detector.js';

export class ChildProcessPtyAdapter implements IPty {
  public readonly provider: PtyProviderType = 'fallback';
  public readonly handleFlowControl = false;
  public readonly process: string;
  public cols: number;
  public rows: number;

  private child: ChildProcess;
  private dataListeners = new Set<(data: string) => void>();
  private exitListeners = new Set<(event: IExitEvent) => void>();
  private isExited = false;

  constructor(
    file?: string,
    args: string[] | string = [],
    options: IPtyForkOptions = {}
  ) {
    const executable = file || getDefaultShell();
    this.process = executable;
    this.cols = Math.max(10, options.cols || 80);
    this.rows = Math.max(5, options.rows || 24);

    const argArray = Array.isArray(args) ? args : [args].filter(Boolean);

    const mergedEnv: Record<string, string> = {
      ...(process.env as Record<string, string>),
      ...(options.env || {}),
      TERM: options.name || 'xterm-256color',
      COLORTERM: 'truecolor',
      FORCE_COLOR: '3',
      COLUMNS: String(this.cols),
      LINES: String(this.rows),
    };

    // Remove undefined values
    for (const key of Object.keys(mergedEnv)) {
      if (mergedEnv[key] === undefined) {
        delete mergedEnv[key];
      }
    }

    this.child = cpSpawn(executable, argArray, {
      cwd: options.cwd || process.cwd(),
      env: mergedEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    if (this.child.stdout) {
      this.child.stdout.setEncoding('utf8');
      this.child.stdout.on('data', (chunk: string) => {
        this.emitData(chunk);
      });
    }

    if (this.child.stderr) {
      this.child.stderr.setEncoding('utf8');
      this.child.stderr.on('data', (chunk: string) => {
        this.emitData(chunk);
      });
    }

    this.child.on('error', (err) => {
      this.emitData(`\r\n\x1b[31m[PTY process error: ${err.message}]\x1b[0m\r\n`);
      this.emitExit({ exitCode: 1 });
    });

    this.child.on('close', (code, signal) => {
      this.emitExit({
        exitCode: code ?? 0,
        signal: signal ?? undefined,
      });
    });
  }

  public get pid(): number {
    return this.child.pid || 0;
  }

  public onData(listener: (data: string) => void): IDisposable {
    this.dataListeners.add(listener);
    return {
      dispose: () => {
        this.dataListeners.delete(listener);
      },
    };
  }

  public onExit(listener: (event: IExitEvent) => void): IDisposable {
    this.exitListeners.add(listener);
    return {
      dispose: () => {
        this.exitListeners.delete(listener);
      },
    };
  }

  public write(data: string): void {
    if (this.child.stdin && !this.child.stdin.destroyed && this.child.stdin.writable) {
      try {
        this.child.stdin.write(data);
      } catch (err) {
        console.error('[ChildProcessPtyAdapter] Failed to write to stdin:', err);
      }
    }
  }

  public resize(cols: number, rows: number): void {
    this.cols = Math.max(10, cols);
    this.rows = Math.max(5, rows);

    // On Unix systems, signal SIGWINCH to the child process if active
    if (process.platform !== 'win32' && this.child.pid && !this.isExited) {
      try {
        process.kill(this.child.pid, 'SIGWINCH');
      } catch {}
    }
  }

  public clear(): void {
    // No-op for child process stream
  }

  public kill(signal?: string): void {
    if (this.isExited) return;
    try {
      this.child.kill((signal as NodeJS.Signals) || 'SIGTERM');
    } catch {}
  }

  public pause(): void {
    this.child.stdout?.pause();
    this.child.stderr?.pause();
  }

  public resume(): void {
    this.child.stdout?.resume();
    this.child.stderr?.resume();
  }

  private emitData(data: string): void {
    for (const listener of this.dataListeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('[ChildProcessPtyAdapter] Listener error onData:', err);
      }
    }
  }

  private emitExit(event: IExitEvent): void {
    if (this.isExited) return;
    this.isExited = true;
    for (const listener of this.exitListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[ChildProcessPtyAdapter] Listener error onExit:', err);
      }
    }
    this.dataListeners.clear();
    this.exitListeners.clear();
  }
}
