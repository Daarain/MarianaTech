import { Worker, Job } from 'bullmq';
import { redisConnection, getIsRedisAvailable, SonarJobData } from '../queue/sonarQueue';
import { ProcessingJobModel, JobStageType } from '../models/processingJob.model';
import { ProcessingRunModel } from '../models/processingRun.model';
import { Mission } from '../models/mission.model';
import { AnomalyModel } from '../models/anomaly.model';
import { requestInferenceFromFastAPI, validateAndSanitizeAnomaly } from '../services/ai.service';

export const STAGES_PIPELINE: { stage: JobStageType; progress: number }[] = [
  { stage: 'VALIDATING', progress: 10 },
  { stage: 'QUALITY_CHECK', progress: 20 },
  { stage: 'PREPROCESSING', progress: 30 },
  { stage: 'DETECTION', progress: 40 },
  { stage: 'SEGMENTATION', progress: 50 },
  { stage: 'CLASSIFICATION', progress: 60 },
  { stage: 'FILTERING', progress: 70 },
  { stage: 'SCORING', progress: 80 },
  { stage: 'GEOTAGGING', progress: 90 },
  { stage: 'SAVING_RESULTS', progress: 95 },
  { stage: 'COMPLETED', progress: 100 },
];

export async function executeMockProcessingPipeline(
  jobId: string,
  missionId: string,
  stepDelayMs: number = 0
): Promise<void> {
  const job = await ProcessingJobModel.findOne({ jobId });
  if (!job) return;

  job.status = 'processing';
  job.startedAt = new Date();
  await job.save();

  await Mission.findOneAndUpdate(
    { $or: [{ id: missionId }, { customId: missionId }] },
    { status: 'processing' }
  );

  const runStartedAt = new Date();

  for (const item of STAGES_PIPELINE) {
    job.currentStage = item.stage;
    job.progress = item.progress;

    // Execute FastAPI inference & persist ProcessingRun + Anomaly records at DETECTION stage
    if (item.stage === 'DETECTION') {
      try {
        const sourceFileId = 'PENDING_FILE';
        const aiResponse = await requestInferenceFromFastAPI({
          jobId,
          missionId,
          fileId: sourceFileId,
          inputReference: `mission_${missionId}_sonar_scan`,
          modelVersion: 'v1.0.0',
        });

        const runId = `RUN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 1. Persist MongoDB ProcessingRun
        const processingRun = await ProcessingRunModel.create({
          runId,
          jobId,
          missionId,
          modelVersion: aiResponse.modelVersion || 'v1.0.0',
          preprocessingVersion: 'v1.0',
          status: aiResponse.status === 'failed' ? 'failed' : 'completed',
          startedAt: runStartedAt,
          completedAt: new Date(),
          error:
            aiResponse.errors && aiResponse.errors.length > 0
              ? aiResponse.errors.join('; ')
              : undefined,
        });

        // 2. Validate, sanitize, and persist MongoDB Anomaly records with GeoJSON location
        if (aiResponse && Array.isArray(aiResponse.anomalies) && aiResponse.anomalies.length > 0) {
          let count = 0;
          for (const rawItem of aiResponse.anomalies) {
            count++;
            const sanitized = validateAndSanitizeAnomaly(
              rawItem,
              aiResponse.modelVersion || 'v1.0.0'
            );
            const customId = `ANM-AI-${Date.now()}-${count}`;

            // Do NOT create location if valid GPS coordinates are unavailable
            const location =
              sanitized.latitude !== null && sanitized.longitude !== null
                ? {
                    type: 'Point' as const,
                    coordinates: [sanitized.longitude, sanitized.latitude] as [number, number], // ALWAYS [longitude, latitude]
                  }
                : undefined;

            await AnomalyModel.create({
              id: customId,
              customId,
              missionId,
              processingRunId: processingRun.runId,
              sourceFileId,
              modelVersion: sanitized.modelVersion,
              className: sanitized.className,
              confidence: sanitized.confidence,
              latitude: sanitized.latitude,
              longitude: sanitized.longitude,
              location,
              priority: sanitized.priority,
              status: 'pending_review',
              depthM: sanitized.depthM,
              sizeM: sanitized.sizeM,
              description: sanitized.description,
              boundingBox: sanitized.boundingBox,
              isDemoData: false,
            });
          }

          // 3. Update Mission anomaly count
          const totalAnomalies = await AnomalyModel.countDocuments({ missionId });
          await Mission.findOneAndUpdate(
            { $or: [{ id: missionId }, { customId: missionId }] },
            { anomalyCount: totalAnomalies }
          );
        }
      } catch (err: any) {
        console.warn(`[Pipeline Warning] AI inference integration error: ${err.message}`);
      }
    }

    if (item.stage === 'COMPLETED') {
      job.status = 'complete';
      job.completedAt = new Date();
      await Mission.findOneAndUpdate(
        { $or: [{ id: missionId }, { customId: missionId }] },
        { status: 'complete' }
      );
    }

    await job.save();

    if (item.stage !== 'COMPLETED' && stepDelayMs > 0) {
      await new Promise((res) => setTimeout(res, stepDelayMs));
    }
  }
}

let sonarWorkerInstance: Worker | null = null;

export function initializeSonarWorker(): Worker | null {
  if (!getIsRedisAvailable()) {
    return null;
  }

  try {
    sonarWorkerInstance = new Worker<SonarJobData>(
      'sonar-processing',
      async (job: Job<SonarJobData>) => {
        const { jobId, missionId } = job.data;
        await executeMockProcessingPipeline(jobId, missionId);
      },
      { connection: redisConnection }
    );

    sonarWorkerInstance.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed successfully.`);
    });

    sonarWorkerInstance.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    return sonarWorkerInstance;
  } catch (e: any) {
    return null;
  }
}

export async function closeSonarWorker(): Promise<void> {
  if (sonarWorkerInstance) {
    try {
      await sonarWorkerInstance.close();
    } catch (e) {
      // Ignore
    }
  }
}
