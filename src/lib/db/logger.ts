import winston from 'winston';
import config from '../config';

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    // JSON format in production for structured logging (Vercel Log Drain compatible)
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length > 1 ? JSON.stringify(meta, null, 2) : ''}`;
          })
        )
  ),
  defaultMeta: { service: 'weber-crm-api' },
  transports: [
    // Console only — Vercel has a read-only filesystem, no file transports
    new winston.transports.Console(),
  ],
  // Don't throw on transport errors in serverless
  exitOnError: false,
});

export default logger;
