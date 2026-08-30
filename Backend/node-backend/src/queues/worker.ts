import { Worker, Job } from 'bullmq';
import { redisClient, isMock } from '../config/redis';
import { SONAR_QUEUE_NAME, SonarJobData } from './sonarQueue';
import { Mission } from '../models/Mission';
import { Anomaly } from '../models/Anomaly';
import { ProcessingJob } from '../models/ProcessingJob';
import { processSonarWithFastAPI } from '../services/aiService';

export async function processJobDirectly(jobId: string, data: SonarJobData) {
  console.log(`[Worker] Starting AI Sonar processing for mission: ${data.missionId}`);

  // Create job record in DB
  const jobRecord = await ProcessingJob.create({
    job_id: jobId,
    mission_id: data.missionId,
    status: 'active',
    stage: 'processing',
    progress: 10,
    started_at: new Date(),
  });

  try {
    // 1. Update Mission status to processing
    await Mission.updateOne({ id: data.missionId }, { status: 'processing' });

    // 2. Call FastAPI AI microservice
    const aiResult = await processSonarWithFastAPI({
      job_id: jobId,
      mission_id: data.missionId,
      sonar_type: data.sonarType,
      depth_min: data.depthMin,
      depth_max: data.depthMax,
    });

    jobRecord.progress = 70;
    jobRecord.stage = 'review';
    await jobRecord.save();

    // 3. Save detected anomalies to MongoDB
    const anomalyDocs = [];
    const missionSuffix = data.missionId.slice(-4);
    let count = 1;

    for (const item of aiResult.anomalies_detected) {
      const anomalyId = `ANM-${missionSuffix}-${String(count++).padStart(3, '0')}`;
      anomalyDocs.push({
        id: anomalyId,
        mission_id: data.missionId,
        job_id: jobRecord._id,
        class_name: item.class_name,
        confidence: item.confidence,
        latitude: item.latitude,
        longitude: item.longitude,
        priority: item.priority,
        status: 'pending_review',
        depth_m: item.depth_m,
        detected_at: new Date().toISOString(),
        size_m: item.size_m,
        description: item.description,
        bounding_box: item.bounding_box,
      });
    }

    if (anomalyDocs.length > 0) {
      // Clear previous anomalies for this mission if re-running
      await Anomaly.deleteMany({ mission_id: data.missionId });
      await Anomaly.insertMany(anomalyDocs);
    }

    // Determine highest priority
    const priorityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    let highestPriority = 'low';
    for (const a of anomalyDocs) {
      if ((priorityRank[a.priority] || 0) > (priorityRank[highestPriority] || 0)) {
        highestPriority = a.priority;
      }
    }

    // 4. Update Mission status to complete
    await Mission.updateOne(
      { id: data.missionId },
      {
        status: 'complete',
        anomaly_count: anomalyDocs.length,
        priority: highestPriority as any,
      }
    );

    jobRecord.status = 'completed';
    jobRecord.stage = 'complete';
    jobRecord.progress = 100;
    jobRecord.completed_at = new Date();
    await jobRecord.save();

    console.log(
      `[Worker] Successfully completed AI Sonar processing for mission ${data.missionId}. Detected ${anomalyDocs.length} anomalies.`
    );
  } catch (err: any) {
    console.error(`[Worker Error] Processing failed for mission ${data.missionId}:`, err);
    await Mission.updateOne({ id: data.missionId }, { status: 'failed' });
    jobRecord.status = 'failed';
    jobRecord.error_log = [err.message];
    await jobRecord.save();
  }
}

let bullWorker: Worker | null = null;

if (!isMock) {
  try {
    bullWorker = new Worker(
      SONAR_QUEUE_NAME,
      async (job: Job<SonarJobData>) => {
        await processJobDirectly(job.id || `job-${Date.now()}`, job.data);
      },
      { connection: redisClient as any }
    );
  } catch (e) {
    console.warn('[Worker Notice] BullMQ worker running in event fallback mode.');
  }
}
