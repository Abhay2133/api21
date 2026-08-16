import fs from 'node:fs';
import os from 'node:os';

/**
 * Detects if the current environment is running inside Termux on Android.
 */
export function isTermux(): boolean {
  if (process.env.TERMUX_VERSION || process.env.TERMUX_MAIN_PACKAGE) {
    return true;
  }
  const prefix = process.env.PREFIX || '';
  if (prefix.includes('com.termux')) {
    return true;
  }
  try {
    if (fs.existsSync('/data/data/com.termux/files/usr')) {
      return true;
    }
  } catch {}
  return false;
}

/**
 * Detects if running on Android OS.
 */
export function isAndroid(): boolean {
  if (process.platform === 'android') {
    return true;
  }
  return isTermux();
}

/**
 * Detects if running on Windows.
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Detects if running on Linux (non-Android).
 */
export function isLinux(): boolean {
  return process.platform === 'linux' && !isAndroid();
}

/**
 * Detects if running on macOS.
 */
export function isDarwin(): boolean {
  return process.platform === 'darwin';
}

/**
 * Determines the most appropriate default interactive shell for the host environment.
 */
export function getDefaultShell(): string {
  // If user explicitly defined SHELL in environment, respect it if valid
  if (process.env.SHELL) {
    return process.env.SHELL;
  }

  // Windows
  if (isWindows()) {
    if (process.env.COMSPEC) {
      return process.env.COMSPEC;
    }
    return 'powershell.exe';
  }

  // Termux on Android
  if (isTermux()) {
    const termuxPrefix = process.env.PREFIX || '/data/data/com.termux/files/usr';
    const termuxBash = `${termuxPrefix}/bin/bash`;
    const termuxSh = `${termuxPrefix}/bin/sh`;
    try {
      if (fs.existsSync(termuxBash)) return termuxBash;
      if (fs.existsSync(termuxSh)) return termuxSh;
    } catch {}
  }

  // Standard POSIX (Linux, macOS, BSD)
  try {
    if (fs.existsSync('/bin/bash')) return '/bin/bash';
    if (fs.existsSync('/usr/bin/bash')) return '/usr/bin/bash';
    if (fs.existsSync('/bin/zsh')) return '/bin/zsh';
    if (fs.existsSync('/usr/bin/zsh')) return '/usr/bin/zsh';
    if (fs.existsSync('/bin/sh')) return '/bin/sh';
  } catch {}

  return 'sh';
}

/**
 * Returns human-readable platform description for debugging and telemetry.
 */
export function getPlatformDescription(): string {
  const osType = os.type();
  const osRelease = os.release();
  const arch = process.arch;
  const termux = isTermux() ? ' (Termux/Bionic)' : '';
  return `${osType} ${osRelease} [${arch}]${termux}`;
}
