import pg from 'pg';
import config from '../config';
import logger from './logger';

const { Pool } = pg;

// In Vercel serverless, each invocation may cold-start a new process.
// We cache the pool on globalThis to reuse across warm invocations,
// and keep max connections low since many instances may run in parallel.
const globalForPg = globalThis as typeof globalThis & { _pgPool?: pg.Pool };

function createPool(): pg.Pool {
  if (globalForPg._pgPool) {
    return globalForPg._pgPool;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: config.database.url,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    // Serverless: keep pool small — many concurrent Lambda instances share the DB
    max: isProduction ? 3 : 10,
    // Short idle timeout so connections are released quickly between invocations
    idleTimeoutMillis: isProduction ? 10000 : 30000,
    connectionTimeoutMillis: 5000,
    // Allow the process to exit even if the pool has idle clients
    allowExitOnIdle: true,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
  });

  if (!isProduction) {
    pool.on('connect', () => {
      logger.info('New database connection established');
    });
  }

  globalForPg._pgPool = pool;
  return pool;
}

const pool = createPool();

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;
