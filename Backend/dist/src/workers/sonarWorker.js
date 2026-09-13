"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGES_PIPELINE = void 0;
exports.executeMockProcessingPipeline = executeMockProcessingPipeline;
exports.initializeSonarWorker = initializeSonarWorker;
exports.closeSonarWorker = closeSonarWorker;
const bullmq_1 = require("bullmq");
const sonarQueue_1 = require("../queue/sonarQueue");
const processingJob_model_1 = require("../models/processingJob.model");
const processingRun_model_1 = require("../models/processingRun.model");
const mission_model_1 = require("../models/mission.model");
const anomaly_model_1 = require("../models/anomaly.model");
const ai_service_1 = require("../services/ai.service");
exports.STAGES_PIPELINE = [
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
async function executeMockProcessingPipeline(jobId, missionId, stepDelayMs = 0) {
    const job = await processingJob_model_1.ProcessingJobModel.findOne({ jobId });
    if (!job)
        return;
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();
    await mission_model_1.Mission.findOneAndUpdate({ $or: [{ id: missionId }, { customId: missionId }] }, { status: 'processing' });
    const runStartedAt = new Date();
    for (const item of exports.STAGES_PIPELINE) {
        job.currentStage = item.stage;
        job.progress = item.progress;
        // Execute FastAPI inference & persist ProcessingRun + Anomaly records at DETECTION stage
        if (item.stage === 'DETECTION') {
            try {
                const sourceFileId = 'PENDING_FILE';
                const aiResponse = await (0, ai_service_1.requestInferenceFromFastAPI)({
                    jobId,
                    missionId,
                    fileId: sourceFileId,
                    inputReference: `mission_${missionId}_sonar_scan`,
                    modelVersion: 'v1.0.0',
                });
                const runId = `RUN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                // 1. Persist MongoDB ProcessingRun
                const processingRun = await processingRun_model_1.ProcessingRunModel.create({
                    runId,
                    jobId,
                    missionId,
                    modelVersion: aiResponse.modelVersion || 'v1.0.0',
                    preprocessingVersion: 'v1.0',
                    status: aiResponse.status === 'failed' ? 'failed' : 'completed',
                    startedAt: runStartedAt,
                    completedAt: new Date(),
                    error: aiResponse.errors && aiResponse.errors.length > 0
                        ? aiResponse.errors.join('; ')
                        : undefined,
                });
                // 2. Validate, sanitize, and persist MongoDB Anomaly records with GeoJSON location
                if (aiResponse && Array.isArray(aiResponse.anomalies) && aiResponse.anomalies.length > 0) {
                    let count = 0;
                    for (const rawItem of aiResponse.anomalies) {
                        count++;
                        const sanitized = (0, ai_service_1.validateAndSanitizeAnomaly)(rawItem, aiResponse.modelVersion || 'v1.0.0');
                        const customId = `ANM-AI-${Date.now()}-${count}`;
                        // Do NOT create location if valid GPS coordinates are unavailable
                        const location = sanitized.latitude !== null && sanitized.longitude !== null
                            ? {
                                type: 'Point',
                                coordinates: [sanitized.longitude, sanitized.latitude], // ALWAYS [longitude, latitude]
                            }
                            : undefined;
                        await anomaly_model_1.AnomalyModel.create({
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
                    const totalAnomalies = await anomaly_model_1.AnomalyModel.countDocuments({ missionId });
                    await mission_model_1.Mission.findOneAndUpdate({ $or: [{ id: missionId }, { customId: missionId }] }, { anomalyCount: totalAnomalies });
                }
            }
            catch (err) {
                console.warn(`[Pipeline Warning] AI inference integration error: ${err.message}`);
            }
        }
        if (item.stage === 'COMPLETED') {
            job.status = 'complete';
            job.completedAt = new Date();
            await mission_model_1.Mission.findOneAndUpdate({ $or: [{ id: missionId }, { customId: missionId }] }, { status: 'complete' });
        }
        await job.save();
        if (item.stage !== 'COMPLETED' && stepDelayMs > 0) {
            await new Promise((res) => setTimeout(res, stepDelayMs));
        }
    }
}
let sonarWorkerInstance = null;
function initializeSonarWorker() {
    if (!(0, sonarQueue_1.getIsRedisAvailable)()) {
        return null;
    }
    try {
        sonarWorkerInstance = new bullmq_1.Worker('sonar-processing', async (job) => {
            const { jobId, missionId } = job.data;
            await executeMockProcessingPipeline(jobId, missionId);
        }, { connection: sonarQueue_1.redisConnection });
        sonarWorkerInstance.on('completed', (job) => {
            console.log(`[Worker] Job ${job.id} completed successfully.`);
        });
        sonarWorkerInstance.on('failed', (job, err) => {
            console.error(`[Worker] Job ${job?.id} failed:`, err.message);
        });
        return sonarWorkerInstance;
    }
    catch (e) {
        return null;
    }
}
async function closeSonarWorker() {
    if (sonarWorkerInstance) {
        try {
            await sonarWorkerInstance.close();
        }
        catch (e) {
            // Ignore
        }
    }
}
