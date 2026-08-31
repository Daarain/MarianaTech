import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marianatech',
  mongodbDbName: process.env.MONGODB_DB_NAME || 'marianatech',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  serviceName: process.env.SERVICE_NAME || 'marianatech-backend',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || '',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  trustProxy: process.env.TRUST_PROXY || '1',

  // Rate Limiting Configuration
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),

  writeRateLimitWindowMs: parseInt(process.env.WRITE_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  writeRateLimitMax: parseInt(process.env.WRITE_RATE_LIMIT_MAX || '30', 10),

  processRateLimitWindowMs: parseInt(process.env.PROCESS_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  processRateLimitMax: parseInt(process.env.PROCESS_RATE_LIMIT_MAX || '10', 10),

  uploadRateLimitWindowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  uploadRateLimitMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '20', 10),

  reportRateLimitWindowMs: parseInt(process.env.REPORT_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  reportRateLimitMax: parseInt(process.env.REPORT_RATE_LIMIT_MAX || '10', 10),
};
