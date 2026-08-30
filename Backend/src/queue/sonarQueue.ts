import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/env';

const QUEUE_NAME = 'sonar-processing';

export const redisConnection = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy: () => null, // Stop retrying if Redis is unavailable
});

// Suppress unhandled ioredis connection error logs during offline testing
redisConnection.on('error', () => {
  // Silent handler
});

let sonarQueueInstance: Queue | null = null;
let isRedisAvailable = false;

export async function initRedisQueue(): Promise<boolean> {
  try {
    await redisConnection.connect();
    isRedisAvailable = true;
    console.log(`[Redis] Connected to Redis server at ${config.redisHost}:${config.redisPort}`);

    sonarQueueInstance = new Queue(QUEUE_NAME, {
      connection: redisConnection,
    });
    return true;
  } catch (err: any) {
    isRedisAvailable = false;
    return false;
  }
}

// Trigger initial async connect
initRedisQueue();

export interface SonarJobData {
  jobId: string;
  missionId: string;
}

export async function addJobToQueue(data: SonarJobData): Promise<boolean> {
  if (isRedisAvailable && sonarQueueInstance) {
    try {
      await sonarQueueInstance.add('process-sonar-mission', data, {
        jobId: data.jobId,
        removeOnComplete: 100,
        removeOnFail: 500,
      });
      return true;
    } catch (err: any) {
      console.warn(`[Queue Error] Failed adding job to BullMQ: ${err.message}. Triggering fallback handler.`);
    }
  }
  return false;
}

export function getIsRedisAvailable(): boolean {
  return isRedisAvailable;
}

export async function closeRedisQueue(): Promise<void> {
  try {
    if (sonarQueueInstance) {
      await sonarQueueInstance.close();
    }
    if (redisConnection.status === 'ready' || redisConnection.status === 'connecting') {
      await redisConnection.quit();
    }
  } catch (e) {
    // Ignore close errors
  }
}
