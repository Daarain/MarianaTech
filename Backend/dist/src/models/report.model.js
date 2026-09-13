"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModel = void 0;
const mongoose_1 = require("mongoose");
const ReportSchema = new mongoose_1.Schema({
    reportId: { type: String, required: true, unique: true, index: true },
    missionId: { type: String, required: true, index: true },
    format: {
        type: String,
        enum: ['json', 'csv', 'pdf'],
        default: 'csv',
        required: true,
    },
    storagePath: { type: String, required: true },
    status: {
        type: String,
        enum: ['completed', 'generating', 'failed'],
        default: 'completed',
        required: true,
    },
    createdBy: { type: String, default: 'system' },
}, {
    timestamps: true,
});
exports.ReportModel = (0, mongoose_1.model)('Report', ReportSchema);
