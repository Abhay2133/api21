import { Injectable, OnModuleInit, OnApplicationShutdown, Logger } from '@nestjs/common';
import dns from 'dns';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import knex, { Knex } from 'knex';
import { config } from '../../config/env.js';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import path from 'path';
import fs from 'fs';

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

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
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

  async onModuleInit() {
    try {
      const client = await this.getDbPool().connect();
      client.release();

      // Run knex migrations
      await this.knex.migrate.latest();
      this.logger.log('PostgreSQL initialized and Knex migrations applied successfully.');
    } catch (err) {
      this.logger.warn(`PostgreSQL connection / migration notice: ${err}`);
    }
  }

  async onApplicationShutdown() {
    this.logger.log('Closing database connection pools...');
    try {
      if (this.knex) await this.knex.destroy();
      if (this.pool) await this.pool.end();
    } catch (err) {
      this.logger.warn(`Error closing database pools: ${err}`);
    }
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
