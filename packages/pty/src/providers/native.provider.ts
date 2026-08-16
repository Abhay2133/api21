import { createRequire } from 'node:module';
import { IPty, IPtyForkOptions, IExitEvent, IDisposable, PtyProviderType } from '../interfaces.js';
import { isTermux, isAndroid, getDefaultShell } from '../utils/env-detector.js';

const require = createRequire(import.meta.url);

interface NativePtyModule {
  spawn(file: string, args: string[] | string, options: any): any;
}

let cachedNativeModule: { module: NativePtyModule; type: PtyProviderType } | null | undefined = undefined;

/**
 * Safely tries to load the native PTY module appropriate for the current platform.
 * Returns null if no native module is available or loadable.
 */
export function getNativePtyModule(): { module: NativePtyModule; type: PtyProviderType } | null {
  if (cachedNativeModule !== undefined) {
    return cachedNativeModule;
  }

  // 1. If running on Termux / Android, prioritize the Termux-optimized fork
  if (isTermux() || isAndroid()) {
    try {
      const termuxMod = require('@mmmbuto/node-pty-android-arm64');
      if (typeof termuxMod?.spawn === 'function') {
        cachedNativeModule = { module: termuxMod, type: 'termux-native' };
        return cachedNativeModule;
      }
    } catch {}
  }

  // 2. Try standard upstream node-pty (Windows ConPTY, Linux x64/arm64, macOS Darwin)
  try {
    const stdMod = require('node-pty');
    if (typeof stdMod?.spawn === 'function') {
      cachedNativeModule = { module: stdMod, type: 'native' };
      return cachedNativeModule;
    }
  } catch {}

  // 3. Try prebuilt multiarch fork if available
  try {
    const prebuiltMod = require('@homebridge/node-pty-prebuilt-multiarch');
    if (typeof prebuiltMod?.spawn === 'function') {
      cachedNativeModule = { module: prebuiltMod, type: 'native' };
      return cachedNativeModule;
    }
  } catch {}

  // 4. If Termux fork was not tried first (e.g. non-Termux environment), try as last native attempt
  if (!isTermux() && !isAndroid()) {
    try {
      const termuxMod = require('@mmmbuto/node-pty-android-arm64');
      if (typeof termuxMod?.spawn === 'function') {
        cachedNativeModule = { module: termuxMod, type: 'termux-native' };
        return cachedNativeModule;
      }
    } catch {}
  }

  cachedNativeModule = null;
  return null;
}

/**
 * Adapter that wraps a native node-pty instance to guarantee unified IPty interface conformance.
 */
export class NativePtyAdapter implements IPty {
  public readonly provider: PtyProviderType;
  private nativeInstance: any;

  constructor(
    nativeMod: NativePtyModule,
    providerType: PtyProviderType,
    file?: string,
    args: string[] | string = [],
    options: IPtyForkOptions = {}
  ) {
    this.provider = providerType;
    const executable = file || getDefaultShell();
    const argList = Array.isArray(args) ? args : [args].filter(Boolean);

    const mergedEnv: Record<string, string> = {
      ...(process.env as Record<string, string>),
      ...(options.env || {}),
      TERM: options.name || 'xterm-256color',
      COLORTERM: 'truecolor',
    };

    this.nativeInstance = nativeMod.spawn(executable, argList, {
      name: options.name || 'xterm-256color',
      cols: options.cols || 80,
      rows: options.rows || 24,
      cwd: options.cwd || process.cwd(),
      env: mergedEnv,
      uid: options.uid,
      gid: options.gid,
      encoding: options.encoding ?? 'utf8',
      handleFlowControl: options.handleFlowControl ?? false,
    });
  }

  public get pid(): number {
    return this.nativeInstance?.pid || 0;
  }

  public get cols(): number {
    return this.nativeInstance?.cols || 80;
  }

  public get rows(): number {
    return this.nativeInstance?.rows || 24;
  }

  public get process(): string {
    return this.nativeInstance?.process || '';
  }

  public get handleFlowControl(): boolean {
    return !!this.nativeInstance?.handleFlowControl;
  }

  public onData(listener: (data: string) => void): IDisposable {
    const disposable = this.nativeInstance?.onData?.(listener);
    if (disposable && typeof disposable.dispose === 'function') {
      return disposable;
    }
    return {
      dispose: () => {},
    };
  }

  public onExit(listener: (event: IExitEvent) => void): IDisposable {
    const disposable = this.nativeInstance?.onExit?.((e: { exitCode: number; signal?: number }) => {
      listener({
        exitCode: e?.exitCode ?? 0,
        signal: e?.signal,
      });
    });
    if (disposable && typeof disposable.dispose === 'function') {
      return disposable;
    }
    return {
      dispose: () => {},
    };
  }

  public write(data: string): void {
    try {
      this.nativeInstance?.write(data);
    } catch (err) {
      console.error('[NativePtyAdapter] Error writing to native PTY:', err);
    }
  }

  public resize(cols: number, rows: number): void {
    try {
      this.nativeInstance?.resize(Math.max(10, cols), Math.max(5, rows));
    } catch (err) {
      // Ignored: resize after process exit in Windows ConPTY
    }
  }

  public clear(): void {
    try {
      this.nativeInstance?.clear?.();
    } catch {}
  }

  public kill(signal?: string): void {
    try {
      this.nativeInstance?.kill?.(signal);
    } catch {}
  }

  public pause(): void {
    try {
      this.nativeInstance?.pause?.();
    } catch {}
  }

  public resume(): void {
    try {
      this.nativeInstance?.resume?.();
    } catch {}
  }
}
