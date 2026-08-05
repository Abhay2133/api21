import { Pool } from 'pg';
import { config } from '../config/env.js';

let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
    });
  }
  return pool;
};

export const initDatabase = async (): Promise<Pool> => {
  const dbPool = getDbPool();
  try {
    // Verify connection
    const client = await dbPool.connect();
    client.release();

    // Auto-migrate tables
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT NOT NULL,
        session_hash VARCHAR(255) NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[Database] PostgreSQL initialized and tables migrated successfully.');
    return dbPool;
  } catch (err) {
    console.error('[Database] Warning/Error connecting to PostgreSQL:', err);
    return dbPool;
  }
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const dbPool = getDbPool();
    await dbPool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};
