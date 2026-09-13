"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingRunModel = void 0;
const mongoose_1 = require("mongoose");
const ProcessingRunSchema = new mongoose_1.Schema({
    runId: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    missionId: { type: String, required: true, index: true },
    modelVersion: { type: String, required: true },
    preprocessingVersion: { type: String, default: 'v1.0' },
    status: {
        type: String,
        enum: ['completed', 'failed'],
        required: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
}, {
    timestamps: true,
});
exports.ProcessingRunModel = (0, mongoose_1.model)('ProcessingRun', ProcessingRunSchema);
