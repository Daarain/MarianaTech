import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marianatech',
  jwtSecret: process.env.JWT_SECRET || 'marianatech_super_secret_jwt_key_2026',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  fastapiUrl: process.env.FASTAPI_URL || 'http://127.0.0.1:8000',
  uploadsDir: path.resolve(process.cwd(), process.env.UPLOADS_DIR || '../uploads'),
};
