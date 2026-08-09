import type { Knex } from 'knex';
import { config } from './src/config/env.js';

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: config.databaseUrl,
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
    },
  },
  test: {
    client: 'pg',
    connection: config.databaseUrl,
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
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
      directory: './src/migrations',
      extension: 'ts',
    },
  },
};

export default knexConfig;
