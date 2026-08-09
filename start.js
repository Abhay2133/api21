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

function runHealthCheck(testPort, targetDir) {
  return new Promise((resolve) => {
    const serverDistPath = path.join(targetDir, 'dist', 'server.js');
    console.log(`[${getTimestamp()}] [HealthCheck] Testing compiled server at: ${serverDistPath} on port ${testPort}`);

    const env = { ...process.env, PORT: String(testPort), NODE_ENV: 'production' };
    const tempProcess = spawn('node', [serverDistPath], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: targetDir,
    });

    let logs = '';
    tempProcess.stdout.on('data', (d) => { logs += d.toString(); });
    tempProcess.stderr.on('data', (d) => { logs += d.toString(); });

    let attempts = 0;
    const maxAttempts = 12;
    const interval = setInterval(() => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${testPort}/api/v1/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            tempProcess.kill('SIGTERM');
            resolve({ success: true, details: `HTTP 200 received. Body: ${body}` });
          }
        });
      });

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          tempProcess.kill('SIGKILL');
          resolve({
            success: false,
            details: `Health check timed out after ${maxAttempts} attempts on port ${testPort}.\nCaptured logs:\n${logs.trim() || '(No output produced)'}`,
          });
        }
      });

      req.end();
    }, 500);

    tempProcess.on('exit', (code) => {
      if (code !== null && code !== 0 && attempts < maxAttempts) {
        clearInterval(interval);
        resolve({
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
    // Step 1: Clone repo to ./tmp/api21
    await logStep(deploymentId, 'Cloning repository into ./tmp/api21...', 'cloning');
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(tmpDir), { recursive: true });

    const repoUrl = getRepoUrl();
    execSync(`git clone --depth 1 "${repoUrl}" "${tmpDir}"`, { stdio: 'pipe' });
    await logStep(deploymentId, 'Repository cloned successfully.');

    // Ensure local .env, src, tsconfig, package.json, pnpm-lock.yaml are synced to tmpDir
    const filesToSync = ['.env', 'package.json', 'pnpm-lock.yaml', 'package-lock.json', 'tsconfig.json'];
    for (const file of filesToSync) {
      const srcPath = path.join(rootDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(tmpDir, file));
      }
    }
    if (fs.existsSync(path.join(rootDir, 'src'))) {
      fs.cpSync(path.join(rootDir, 'src'), path.join(tmpDir, 'src'), { recursive: true });
    }

    // Step 2: Install dependencies & Build
    await logStep(deploymentId, 'Installing dependencies in ./tmp/api21...', 'building');
    try {
      execSync('pnpm install --frozen-lockfile', { cwd: tmpDir, stdio: 'pipe' });
    } catch {
      try {
        execSync('npx -y pnpm install', { cwd: tmpDir, stdio: 'pipe' });
      } catch {
        execSync('npm install', { cwd: tmpDir, stdio: 'pipe' });
      }
    }

    await logStep(deploymentId, 'Building TypeScript project in ./tmp/api21...');
    execSync('npm run build', { cwd: tmpDir, stdio: 'pipe' });
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

    const distOld = path.join(rootDir, 'dist_old');
    const distCurrent = path.join(rootDir, 'dist');
    const distNew = path.join(tmpDir, 'dist');

    if (fs.existsSync(distOld)) {
      fs.rmSync(distOld, { recursive: true, force: true });
    }

    if (fs.existsSync(distCurrent)) {
      fs.renameSync(distCurrent, distOld);
    }

    fs.renameSync(distNew, distCurrent);

    // Stop existing PM2 processes if running
    try {
      execSync('npx pm2 stop ecosystem.config.cjs', { cwd: rootDir, stdio: 'pipe' });
    } catch {}

    // Start detached PM2 server in a new process
    const pm2Child = spawn('npx', ['pm2', 'start', 'ecosystem.config.cjs'], {
      cwd: rootDir,
      detached: true,
      stdio: 'ignore',
    });
    pm2Child.unref();

    await logStep(deploymentId, 'PM2 processes started successfully. Operations complete!', 'completed');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logStep(deploymentId, `Deployment failed: ${errorMsg}`, 'failed');
    console.error(`[${getTimestamp()}] [Start:${deploymentId || 'CLI'}] Error:`, errorMsg);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
