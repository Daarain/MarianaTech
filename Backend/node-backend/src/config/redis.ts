import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { config } from './env';

let redisClient: Redis;
let isMock = false;

try {
  redisClient = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection timed out. Falling back to in-memory Redis mock engine...');
        isMock = true;
        return null; // Stop retrying real redis
      }
      return Math.min(times * 100, 1000);
    },
  });

  redisClient.on('error', (err) => {
    if (!isMock) {
      console.warn(`[Redis Notice] ${err.message}. Using in-memory queue fallback.`);
    }
  });

  redisClient.on('connect', () => {
    if (!isMock) {
      console.log(`[Redis] Connected to ${config.redisHost}:${config.redisPort}`);
    }
  });
} catch (e) {
  console.warn('[Redis] Initializing in-memory fallback engine...');
  redisClient = new RedisMock() as any;
  isMock = true;
}

export { redisClient, isMock };
