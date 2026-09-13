"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMissionFileHandler = uploadMissionFileHandler;
exports.getMissionFilesHandler = getMissionFilesHandler;
const missionFile_service_1 = require("../services/missionFile.service");
const mission_service_1 = require("../services/mission.service");
async function uploadMissionFileHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const mission = await (0, mission_service_1.fetchMissionById)(missionId);
        if (!mission) {
            res.status(404).json({ error: 'Mission not found', statusCode: 404 });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded', statusCode: 400 });
            return;
        }
        const fileDoc = await (0, missionFile_service_1.uploadMissionFileRecord)(missionId, req.file);
        res.status(201).json(fileDoc);
    }
    catch (error) {
        res.status(400).json({
            error: error.message || 'File upload failed',
            statusCode: 400,
        });
    }
}
async function getMissionFilesHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const files = await (0, missionFile_service_1.getFilesForMission)(missionId);
        res.status(200).json(files);
    }
    catch (error) {
        next(error);
    }
}
