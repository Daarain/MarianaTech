"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionFileModel = void 0;
const mongoose_1 = require("mongoose");
const MissionFileSchema = new mongoose_1.Schema({
    missionId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    size: { type: Number, required: true },
    format: { type: String, required: true },
    mimeType: { type: String, required: true },
    checksum: { type: String, default: '' },
    storageProvider: {
        type: String,
        enum: ['local', 'minio', 's3'],
        default: 'local',
        required: true,
    },
    storagePath: { type: String, required: true },
    uploadStatus: {
        type: String,
        enum: ['pending', 'uploading', 'completed', 'failed'],
        default: 'pending',
        required: true,
    },
    validationStatus: {
        type: String,
        enum: ['pending', 'valid', 'invalid'],
        default: 'pending',
        required: true,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            return {
                id: ret._id.toString(),
                missionId: ret.missionId,
                fileName: ret.fileName,
                originalFileName: ret.originalFileName,
                size: ret.size,
                format: ret.format,
                mimeType: ret.mimeType,
                checksum: ret.checksum || null,
                storageProvider: ret.storageProvider,
                storagePath: ret.storagePath,
                uploadStatus: ret.uploadStatus,
                validationStatus: ret.validationStatus,
                createdAt: ret.createdAt,
                updatedAt: ret.updatedAt,
            };
        },
    },
});
exports.MissionFileModel = (0, mongoose_1.model)('MissionFile', MissionFileSchema);
