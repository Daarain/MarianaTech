"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingJobModel = void 0;
const mongoose_1 = require("mongoose");
const ProcessingJobSchema = new mongoose_1.Schema({
    jobId: { type: String, required: true, unique: true, index: true },
    job_id: {
        type: String,
        default: function () {
            return this.jobId;
        },
    },
    missionId: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ['queued', 'processing', 'complete', 'failed'],
        default: 'queued',
        required: true,
    },
    progress: { type: Number, default: 0, required: true },
    currentStage: {
        type: String,
        enum: [
            'VALIDATING',
            'QUALITY_CHECK',
            'PREPROCESSING',
            'DETECTION',
            'SEGMENTATION',
            'CLASSIFICATION',
            'FILTERING',
            'SCORING',
            'GEOTAGGING',
            'SAVING_RESULTS',
            'COMPLETED',
        ],
        default: 'VALIDATING',
        required: true,
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    retryCount: { type: Number, default: 0, required: true },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            return {
                jobId: ret.jobId || ret.job_id,
                missionId: ret.missionId,
                status: ret.status,
                progress: ret.progress,
                currentStage: ret.currentStage,
                startedAt: ret.startedAt ? ret.startedAt.toISOString() : null,
                completedAt: ret.completedAt ? ret.completedAt.toISOString() : null,
                errorCode: ret.errorCode || null,
                errorMessage: ret.errorMessage || null,
                retryCount: ret.retryCount || 0,
                createdAt: ret.createdAt,
                updatedAt: ret.updatedAt,
            };
        },
    },
});
exports.ProcessingJobModel = (0, mongoose_1.model)('ProcessingJob', ProcessingJobSchema);
