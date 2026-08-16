export interface IDisposable {
  dispose(): void;
}

export interface IExitEvent {
  exitCode: number;
  signal?: number | string;
}

export type PtyProviderType = 'native' | 'termux-native' | 'fallback';

export interface IPtyForkOptions {
  name?: string;
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: Record<string, string | undefined>;
  uid?: number;
  gid?: number;
  encoding?: string | null;
  handleFlowControl?: boolean;
}

export interface IPtySpawnOptions extends IPtyForkOptions {
  /**
   * If true, forces the use of the child_process fallback adapter
   * even if native PTY bindings are available.
   */
  forceFallback?: boolean;
}

export interface IPty {
  /**
   * Process ID of the spawned terminal or shell.
   */
  readonly pid: number;

  /**
   * The number of columns in the pseudo-terminal.
   */
  readonly cols: number;

  /**
   * The number of rows in the pseudo-terminal.
   */
  readonly rows: number;

  /**
   * The process / shell title or command name.
   */
  readonly process: string;

  /**
   * The underlying provider used to create this PTY instance.
   */
  readonly provider: PtyProviderType;

  /**
   * Whether flow control is enabled.
   */
  readonly handleFlowControl: boolean;

  /**
   * Adds a listener for output data from the PTY process.
   */
  onData(listener: (data: string) => void): IDisposable;

  /**
   * Adds a listener for when the PTY process exits.
   */
  onExit(listener: (event: IExitEvent) => void): IDisposable;

  /**
   * Writes data (e.g. keyboard input, control characters) to the PTY stdin.
   */
  write(data: string): void;

  /**
   * Resizes the pseudo-terminal dimensions and emits a window resize signal.
   */
  resize(cols: number, rows: number): void;

  /**
   * Clears internal state/buffers if applicable.
   */
  clear(): void;

  /**
   * Kills the PTY process with an optional signal (e.g. 'SIGTERM', 'SIGKILL').
   */
  kill(signal?: string): void;

  /**
   * Pauses the data stream from the PTY.
   */
  pause(): void;

  /**
   * Resumes the data stream from the PTY.
   */
  resume(): void;
}
