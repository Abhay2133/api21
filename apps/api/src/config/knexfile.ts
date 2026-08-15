import type { Knex } from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: config.databaseUrl,
    migrations: {
      directory: migrationsDir,
      extension: 'ts',
      loadExtensions: ['.ts', '.js'],
    },
  },
  test: {
    client: 'pg',
    connection: config.databaseUrl,
    migrations: {
      directory: migrationsDir,
      extension: 'ts',
      loadExtensions: ['.ts', '.js'],
    },
  },
  production: {
    client: 'pg',
    connection: config.databaseUrl,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: migrationsDir,
      extension: 'ts',
      loadExtensions: ['.ts', '.js'],
    },
  },
};

export default knexConfig;
