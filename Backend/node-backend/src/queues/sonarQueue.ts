import { Queue } from 'bullmq';
import { redisClient, isMock } from '../config/redis';

export const SONAR_QUEUE_NAME = 'sonar-processing-queue';

export let sonarQueue: Queue | null = null;

try {
  if (!isMock) {
    sonarQueue = new Queue(SONAR_QUEUE_NAME, {
      connection: redisClient as any,
    });
  }
} catch (e) {
  console.warn('[Queue Notice] Operating queue in direct event processing mode.');
}

export interface SonarJobData {
  missionId: string;
  files: { name: string; size: number; path?: string }[];
  depthMin: number;
  depthMax: number;
  sonarType: string;
}

export async function addSonarProcessingJob(data: SonarJobData): Promise<string> {
  const jobId = `job-${data.missionId}-${Date.now()}`;
  let enqueued = false;

  if (sonarQueue && !isMock) {
    try {
      await sonarQueue.add('process-sonar', data, {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
      enqueued = true;
    } catch (err: any) {
      console.warn(`[Queue Notice] Could not enqueue to Redis (${err.message}). Using direct background worker fallback.`);
    }
  }

  if (!enqueued) {
    // Immediate async execution fallback if Redis is in mock mode or unavailable
    setTimeout(() => {
      import('./worker').then(({ processJobDirectly }) => {
        processJobDirectly(jobId, data).catch((err: any) =>
          console.error('[Queue Worker Direct Exec Error]', err)
        );
      });
    }, 100);
  }
  return jobId;
}
