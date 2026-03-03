const isProduction = process.env.NODE_ENV === 'production';

// Vercel provides POSTGRES_URL / POSTGRES_URL_NON_POOLING for managed Postgres (Neon)
const databaseUrl = process.env.DATABASE_URL
  || process.env.POSTGRES_URL
  || process.env.POSTGRES_URL_NON_POOLING;

// Detect if SSL should be enabled
const sslNeeded = isProduction
  || !!databaseUrl?.match(/neon\.tech|supabase|aws|azure|railway|cockroachlabs|render/);

export const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    isProduction,
  },
  database: {
    url: databaseUrl,
    ssl: sslNeeded ? { rejectUnauthorized: false } : false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || (isProduction ? '' : 'dev_secret_key_do_not_use_in_prod'),
    expiry: process.env.JWT_EXPIRY || '24h',
  },
  logging: {
    level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info'),
  },
};

// Validate critical env vars at startup (server-side only)
if (typeof window === 'undefined' && isProduction) {
  const missing: string[] = [];
  if (!config.database.url) missing.push('DATABASE_URL or POSTGRES_URL');
  if (!config.jwt.secret) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default config;
