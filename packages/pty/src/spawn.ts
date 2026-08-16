import { IPty, IPtySpawnOptions, PtyProviderType } from './interfaces.js';
import { getNativePtyModule, NativePtyAdapter } from './providers/native.provider.js';
import { ChildProcessPtyAdapter } from './providers/fallback.adapter.js';
import { getDefaultShell, getPlatformDescription } from './utils/env-detector.js';

/**
 * Spawns a pseudo-terminal process using the best available engine for the current platform.
 * Automatically chooses between native PTY (Windows ConPTY, Linux/macOS, Termux Bionic)
 * and an enhanced ChildProcess fallback adapter.
 */
export function spawn(
  file?: string,
  args: string[] | string = [],
  options: IPtySpawnOptions = {}
): IPty {
  const targetFile = file || getDefaultShell();

  // If fallback is explicitly forced, bypass native module detection
  if (options.forceFallback) {
    return new ChildProcessPtyAdapter(targetFile, args, options);
  }

  // Attempt to load and instantiate using native PTY module
  const native = getNativePtyModule();
  if (native) {
    try {
      return new NativePtyAdapter(native.module, native.type, targetFile, args, options);
    } catch (err) {
      console.warn(
        `[PtyFactory] Native PTY spawn failed (${native.type}). Falling back to child_process adapter:`,
        err
      );
    }
  }

  // Fallback to pure Node child_process adapter
  return new ChildProcessPtyAdapter(targetFile, args, options);
}

/**
 * Returns diagnostic information regarding the current active PTY provider.
 */
export function getPtyProviderStatus(): {
  provider: PtyProviderType;
  isNative: boolean;
  platform: string;
  defaultShell: string;
} {
  const native = getNativePtyModule();
  return {
    provider: native ? native.type : 'fallback',
    isNative: native !== null,
    platform: getPlatformDescription(),
    defaultShell: getDefaultShell(),
  };
}
