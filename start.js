import fs from 'fs';
import path from 'path';
import http from 'http';
import dns from 'dns';
import { execSync, spawn } from 'child_process';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Prefer IPv4 DNS resolution to prevent ENETUNREACH on hosts with IPv6 AAAA records
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable';

const pool = new Pool({ connectionString: databaseUrl });

function getTimestamp() {
  return new Date().toISOString();
}

async function logStep(deploymentId, message, status = null) {
  const ts = getTimestamp();
  if (!deploymentId) {
    console.log(`[${ts}] [Start] ${message}`);
    return;
  }

  console.log(`[${ts}] [Deployment:${deploymentId}] ${message}`);
  try {
    if (status) {
      await pool.query(
        'UPDATE deployments SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, deploymentId]
      );
    } else {
      await pool.query('UPDATE deployments SET updated_at = NOW() WHERE id = $1', [deploymentId]);
    }
    await pool.query(
      'INSERT INTO deployment_logs (deployment_id, message, created_at) VALUES ($1, $2, NOW())',
      [deploymentId, message]
    );
  } catch (err) {
    console.error(`[${ts}] [Deployment:${deploymentId}] Failed to log to DB:`, err.message);
  }
}

async function ensureTablesExist() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR(255) NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error(`[${getTimestamp()}] [Deployment] Error ensuring tables exist:`, err.message);
  }
}

function getRepoUrl() {
  try {
    const url = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    if (url) return url;
  } catch {}
  return 'https://github.com/abhay2133/api21.git';
}

function getBranchName() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (branch && branch !== 'HEAD') return branch;
  } catch {}
  return 'prod';
}

function runHealthCheck(testPort, targetDir) {
  return new Promise((resolve) => {
    const apiMainDistPath = path.join(targetDir, 'apps', 'api', 'dist', 'main.js');
    const mainDistPath = path.join(targetDir, 'dist', 'main.js');
    const serverDistPath = path.join(targetDir, 'dist', 'server.js');
    const entrypoint = fs.existsSync(apiMainDistPath)
      ? apiMainDistPath
      : fs.existsSync(mainDistPath)
        ? mainDistPath
        : serverDistPath;
    console.log(`[${getTimestamp()}] [HealthCheck] Testing compiled server at: ${entrypoint} on port ${testPort}`);

    const env = { ...process.env, PORT: String(testPort), NODE_ENV: 'production' };
    const tempProcess = spawn('node', [entrypoint], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: targetDir,
    });

    let logs = '';
    tempProcess.stdout.on('data', (d) => {
      const str = d.toString();
      logs += str;
      process.stdout.write(`[Server stdout] ${str}`);
    });
    tempProcess.stderr.on('data', (d) => {
      const str = d.toString();
      logs += str;
      process.stderr.write(`[Server stderr] ${str}`);
    });

    let attempts = 0;
    const maxAttempts = 25; // 25 seconds max timeout
    let resolved = false;

    const cleanupAndResolve = (result) => {
      if (resolved) return;
      resolved = true;
      clearInterval(interval);

      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve(result);
        }
      };

      if (tempProcess.exitCode !== null) {
        finish();
      } else {
        tempProcess.once('exit', finish);
        try {
          tempProcess.kill('SIGTERM');
          setTimeout(() => {
            if (tempProcess.exitCode === null) {
              try { tempProcess.kill('SIGKILL'); } catch {}
            }
            finish();
          }, 1000);
        } catch {
          finish();
        }
      }
    };

    const interval = setInterval(() => {
      if (resolved) return;
      attempts++;

      if (attempts >= maxAttempts) {
        return cleanupAndResolve({
          success: false,
          details: `Health check timed out after ${maxAttempts} seconds on port ${testPort}.\nCaptured logs:\n${logs.trim() || '(No output produced)'}`,
        });
      }

      if (attempts % 5 === 0) {
        console.log(`[${getTimestamp()}] [HealthCheck] Waiting for server startup on port ${testPort} (${attempts}/${maxAttempts}s)...`);
      }

      const req = http.get(`http://127.0.0.1:${testPort}/api/v1/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            cleanupAndResolve({ success: true, details: `HTTP 200 received. Body: ${body}` });
          }
        });
      });

      req.setTimeout(2000, () => {
        req.destroy();
      });

      req.on('error', () => {
        // Connection error or destroyed socket - retry on next interval tick
      });

      req.end();
    }, 1000);

    tempProcess.on('exit', (code) => {
      if (!resolved && code !== null && code !== 0) {
        cleanupAndResolve({
          success: false,
          details: `Process exited prematurely with code ${code}.\nCaptured logs:\n${logs.trim() || '(No output produced)'}`,
        });
      }
    });
  });
}

async function main() {
  await ensureTablesExist();

  const deploymentId = process.argv[2]; // May be undefined if called directly from CLI

  // Only create/lookup deployment record if deploymentId is provided
  if (deploymentId) {
    const depRes = await pool.query('SELECT * FROM deployments WHERE id = $1', [deploymentId]);
    if (depRes.rows.length === 0) {
      await pool.query(
        'INSERT INTO deployments (id, status, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [deploymentId, 'pending']
      );
    }
  }

  await logStep(
    deploymentId,
    deploymentId ? `Starting deployment process (ID: ${deploymentId})` : 'Starting server process directly',
    'pending'
  );

  const rootDir = process.cwd();
  const tmpDir = path.join(rootDir, 'tmp', 'api21');

  try {
    // Step 1: Clone or update repo in ./tmp/api21
    const repoUrl = getRepoUrl();
    const branchName = getBranchName();

    if (fs.existsSync(path.join(tmpDir, '.git'))) {
      await logStep(deploymentId, `Updating existing repository in ./tmp/api21 (branch '${branchName}')...`, 'cloning');
      try {
        execSync(`git fetch origin "${branchName}" --depth 1`, { cwd: tmpDir, stdio: 'inherit' });
        execSync('git reset --hard FETCH_HEAD', { cwd: tmpDir, stdio: 'inherit' });
        execSync('git clean -fdx', { cwd: tmpDir, stdio: 'inherit' });
      } catch {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(tmpDir), { recursive: true });
        execSync(`git clone --depth 1 --single-branch -b "${branchName}" "${repoUrl}" "${tmpDir}"`, { stdio: 'inherit' });
      }
    } else {
      await logStep(deploymentId, `Cloning branch '${branchName}' into ./tmp/api21...`, 'cloning');
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      fs.mkdirSync(path.dirname(tmpDir), { recursive: true });
      execSync(`git clone --depth 1 --single-branch -b "${branchName}" "${repoUrl}" "${tmpDir}"`, { stdio: 'inherit' });
    }
    await logStep(deploymentId, 'Repository prepared successfully.');

    // Ensure local .env, configs, and workspaces are synced to tmpDir
    const filesToSync = [
      '.env',
      'package.json',
      'pnpm-lock.yaml',
      'package-lock.json',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      'ecosystem.config.cjs',
    ];
    for (const file of filesToSync) {
      const srcPath = path.join(rootDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(tmpDir, file));
      }
    }
    if (fs.existsSync(path.join(rootDir, 'packages'))) {
      fs.cpSync(path.join(rootDir, 'packages'), path.join(tmpDir, 'packages'), { recursive: true });
    }
    if (fs.existsSync(path.join(rootDir, 'apps'))) {
      fs.cpSync(path.join(rootDir, 'apps'), path.join(tmpDir, 'apps'), { recursive: true });
    }
    if (fs.existsSync(path.join(rootDir, 'static'))) {
      fs.cpSync(path.join(rootDir, 'static'), path.join(tmpDir, 'static'), { recursive: true });
    }

    // Step 2: Install dependencies & Build
    await logStep(deploymentId, 'Installing dependencies in ./tmp/api21...', 'building');
    const buildEnv = { ...process.env, NODE_ENV: 'development' };
    try {
      execSync('pnpm install --frozen-lockfile', { cwd: tmpDir, env: buildEnv, stdio: 'inherit' });
    } catch {
      try {
        execSync('pnpm install', { cwd: tmpDir, env: buildEnv, stdio: 'inherit' });
      } catch {
        execSync('npm install --legacy-peer-deps --include=dev', { cwd: tmpDir, env: buildEnv, stdio: 'inherit' });
      }
    }

    await logStep(deploymentId, 'Building TypeScript project in ./tmp/api21...');
    execSync('npm run build:api', { cwd: tmpDir, env: buildEnv, stdio: 'inherit' });
    
    const apiMainDistPath = path.join(tmpDir, 'apps', 'api', 'dist', 'main.js');
    const mainDistPath = path.join(tmpDir, 'dist', 'main.js');
    const serverDistPath = path.join(tmpDir, 'dist', 'server.js');
    if (!fs.existsSync(apiMainDistPath) && !fs.existsSync(mainDistPath) && !fs.existsSync(serverDistPath)) {
      throw new Error(`Build failed: Compiled entrypoint not found at ${apiMainDistPath}`);
    }
    
    await logStep(deploymentId, 'Build completed successfully.');

    // Step 3: Health Check Best Practice
    await logStep(deploymentId, 'Running pre-deployment health check on compiled dist...', 'health_checking');
    const testPort = 3999;
    const healthResult = await runHealthCheck(testPort, tmpDir);

    if (!healthResult.success) {
      throw new Error(`Health check failed: ${healthResult.details}`);
    }

    await logStep(deploymentId, `Health check passed! Details: ${healthResult.details}`);

    // Step 4: Stop running processes, Swap dist directory, and start PM2 server
    await logStep(deploymentId, 'Promoting deployment: Swapping dist directory and restarting processes...');

    // Swap monorepo apps/api/dist if monorepo, else root dist
    const apiDistNew = path.join(tmpDir, 'apps', 'api', 'dist');
    const apiDistCurrent = path.join(rootDir, 'apps', 'api', 'dist');
    if (fs.existsSync(apiDistNew)) {
      if (fs.existsSync(apiDistCurrent)) {
        fs.rmSync(apiDistCurrent, { recursive: true, force: true });
      }
      fs.cpSync(apiDistNew, apiDistCurrent, { recursive: true });
    }

    const distOld = path.join(rootDir, 'dist_old');
    const distCurrent = path.join(rootDir, 'dist');
    const distNew = path.join(tmpDir, 'dist');

    if (fs.existsSync(distNew)) {
      if (fs.existsSync(distOld)) {
        fs.rmSync(distOld, { recursive: true, force: true });
      }
      if (fs.existsSync(distCurrent)) {
        fs.cpSync(distCurrent, distOld, { recursive: true });
        fs.rmSync(distCurrent, { recursive: true, force: true });
      }
      fs.cpSync(distNew, distCurrent, { recursive: true });
    }

    // Delete existing PM2 processes to clear any cached env variables in PM2
    try {
      execSync('npx pm2 delete ecosystem.config.cjs', { cwd: rootDir, stdio: 'pipe' });
    } catch {}

    // Start detached PM2 processes with updated environment
    const pm2Child = spawn('npx', ['pm2', 'start', 'ecosystem.config.cjs', '--update-env'], {
      cwd: rootDir,
      detached: true,
      stdio: 'ignore',
    });
    pm2Child.unref();

    await logStep(deploymentId, 'PM2 processes started successfully. Operations complete!', 'completed');
  } catch (err) {
    let errorMsg = err instanceof Error ? err.message : String(err);
    if (err && typeof err === 'object') {
      const stdout = err.stdout ? err.stdout.toString().trim() : '';
      const stderr = err.stderr ? err.stderr.toString().trim() : '';
      const details = [stdout, stderr].filter(Boolean).join('\n');
      if (details) {
        errorMsg += `\nDetails:\n${details}`;
      }
    }
    await logStep(deploymentId, `Deployment failed: ${errorMsg}`, 'failed');
    console.error(`[${getTimestamp()}] [Start:${deploymentId || 'CLI'}] Error:`, errorMsg);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
