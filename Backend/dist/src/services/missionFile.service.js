"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileMetadataFromMission = createFileMetadataFromMission;
exports.uploadMissionFileRecord = uploadMissionFileRecord;
exports.getFilesForMission = getFilesForMission;
const missionFile_model_1 = require("../models/missionFile.model");
const fileValidation_1 = require("../utils/fileValidation");
const storage_service_1 = require("./storage.service");
async function createFileMetadataFromMission(missionId, files) {
    const fileDocs = [];
    for (const f of files) {
        const validation = (0, fileValidation_1.validateFileMetadata)(f.name, f.size);
        const doc = await missionFile_model_1.MissionFileModel.create({
            missionId,
            fileName: f.name,
            originalFileName: f.name,
            size: f.size,
            format: validation.format,
            mimeType: validation.mimeType,
            checksum: '',
            storageProvider: process.env.STORAGE_PROVIDER || 'local',
            storagePath: `pending_binary_upload/${f.name}`,
            uploadStatus: 'pending',
            validationStatus: validation.isValid ? 'valid' : 'invalid',
        });
        fileDocs.push(doc);
    }
    return fileDocs;
}
async function uploadMissionFileRecord(missionId, file) {
    const validation = (0, fileValidation_1.validateFileMetadata)(file.originalname, file.size, file.mimetype);
    if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file uploaded');
    }
    const checksum = (0, fileValidation_1.calculateBufferChecksum)(file.buffer);
    const saveResult = await storage_service_1.storageService.saveFile(missionId, file.originalname, file.buffer);
    // Store metadata & storage reference in MongoDB (never store raw binary buffers in Mongo)
    const doc = await missionFile_model_1.MissionFileModel.create({
        missionId,
        fileName: file.filename || file.originalname,
        originalFileName: file.originalname,
        size: file.size,
        format: validation.format,
        mimeType: validation.mimeType,
        checksum,
        storageProvider: saveResult.storageProvider,
        storagePath: saveResult.storagePath,
        uploadStatus: 'completed',
        validationStatus: 'valid',
    });
    // Note: AI processing is NOT started automatically upon upload as per requirements.
    return doc;
}
async function getFilesForMission(missionId) {
    const files = await missionFile_model_1.MissionFileModel.find({ missionId }).sort({ createdAt: -1 });
    return files;
}
