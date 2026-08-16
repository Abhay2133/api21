import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, getPtyProviderStatus, ChildProcessPtyAdapter } from '../index.js';

describe('@api21/pty Universal PTY Engine', () => {
  it('should report provider diagnostic status', () => {
    const status = getPtyProviderStatus();
    assert.ok(status.platform);
    assert.ok(status.defaultShell);
    assert.ok(['native', 'termux-native', 'fallback'].includes(status.provider));
  });

  it('should instantiate ChildProcessPtyAdapter cleanly', async () => {
    const ptyProcess = new ChildProcessPtyAdapter(undefined, [], {
      cols: 80,
      rows: 24,
    });

    assert.ok(ptyProcess.pid > 0);
    assert.equal(ptyProcess.cols, 80);
    assert.equal(ptyProcess.rows, 24);
    assert.equal(ptyProcess.provider, 'fallback');

    ptyProcess.kill();
  });

  it('should spawn, write, resize, and handle exit', async () => {
    const ptyProcess = spawn(undefined, [], {
      cols: 100,
      rows: 30,
      forceFallback: true,
    });

    assert.ok(ptyProcess.pid > 0);
    assert.equal(ptyProcess.cols, 100);
    assert.equal(ptyProcess.rows, 30);

    ptyProcess.resize(120, 40);
    assert.equal(ptyProcess.cols, 120);
    assert.equal(ptyProcess.rows, 40);

    let receivedData = '';
    const dataSub = ptyProcess.onData((data) => {
      receivedData += data;
    });

    // Write simple command
    ptyProcess.write('echo "hello-pty"\n');

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        ptyProcess.kill();
        resolve();
      }, 500);

      ptyProcess.onExit(() => {
        clearTimeout(timer);
        resolve();
      });
    });

    dataSub.dispose();
  });
});
