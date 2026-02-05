export const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('aws')) ? { rejectUnauthorized: false } : false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
    expiry: process.env.JWT_EXPIRY || '24h',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
