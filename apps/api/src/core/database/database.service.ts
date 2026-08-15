import dns from 'dns';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/env.js';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

function getMigrationsDir(): string {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, 'apps/api/src/migrations'),
    path.resolve(cwd, 'src/migrations'),
    path.resolve(cwd, 'apps/api/dist/migrations'),
    path.resolve(cwd, 'dist/migrations'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || path.resolve(cwd, 'apps/api/src/migrations');
}

export class DatabaseService {
  private pool: Pool | null = null;
  public knex: Knex;

  constructor() {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
    });

    this.knex = knex({
      client: 'pg',
      connection: config.databaseUrl,
      pool: { min: 2, max: 10 },
      migrations: {
        directory: getMigrationsDir(),
        extension: 'ts',
        loadExtensions: ['.ts', '.js'],
      },
    });
  }

  async init(): Promise<void> {
    try {
      const client = await this.getDbPool().connect();
      client.release();

      // Run knex migrations
      await this.knex.migrate.latest();
      console.log('[Database] PostgreSQL initialized and Knex migrations applied successfully.');
    } catch (err) {
      console.warn(`[Database] PostgreSQL connection / migration notice: ${err}`);
    }
  }

  // Alias for backward compatibility with tests
  async onModuleInit(): Promise<void> {
    return this.init();
  }

  async close(): Promise<void> {
    try {
      if (this.knex) await this.knex.destroy();
      if (this.pool) await this.pool.end();
    } catch (err) {
      console.warn(`[Database] Error closing database pools: ${err}`);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    return this.close();
  }

  getDbPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({ connectionString: config.databaseUrl });
    }
    return this.pool;
  }

  async query<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
    const pool = this.getDbPool();
    return pool.query<R>(text, params);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const pool = this.getDbPool();
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export const databaseService = new DatabaseService();
