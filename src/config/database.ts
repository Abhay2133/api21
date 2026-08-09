import dns from 'dns';
import { Pool } from 'pg';
import { config } from './env.js';
import { getKnexDb } from './knex.js';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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

    // Run Knex migrations
    const knex = getKnexDb();
    await knex.migrate.latest();

    console.log('[Database] PostgreSQL initialized and Knex migrations applied successfully.');
    return dbPool;
  } catch (err) {
    console.error('[Database] Warning/Error connecting to PostgreSQL or running migrations:', err);
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
