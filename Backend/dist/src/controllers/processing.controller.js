"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionHandler = processMissionHandler;
exports.getJobDetailsHandler = getJobDetailsHandler;
exports.retryJobHandler = retryJobHandler;
const processing_service_1 = require("../services/processing.service");
async function processMissionHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const job = await (0, processing_service_1.triggerMissionProcessing)(missionId);
        res.status(202).json(job);
    }
    catch (error) {
        if (error.message === 'MISSION_NOT_FOUND') {
            res.status(404).json({ error: 'Mission not found', statusCode: 404 });
            return;
        }
        if (error.message === 'MISSION_ALREADY_PROCESSING') {
            res.status(400).json({ error: 'Mission is already being processed or completed', statusCode: 400 });
            return;
        }
        next(error);
    }
}
async function getJobDetailsHandler(req, res, next) {
    try {
        const { jobId } = req.params;
        const job = await (0, processing_service_1.getProcessingJobDetails)(jobId);
        if (!job) {
            res.status(404).json({ error: 'Processing job not found', statusCode: 404 });
            return;
        }
        res.status(200).json(job);
    }
    catch (error) {
        next(error);
    }
}
async function retryJobHandler(req, res, next) {
    try {
        const { jobId } = req.params;
        const job = await (0, processing_service_1.retryProcessingJob)(jobId);
        res.status(200).json(job);
    }
    catch (error) {
        if (error.message === 'JOB_NOT_FOUND') {
            res.status(404).json({ error: 'Processing job not found', statusCode: 404 });
            return;
        }
        next(error);
    }
}
