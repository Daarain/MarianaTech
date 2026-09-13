"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMissionReportHandler = createMissionReportHandler;
exports.downloadMissionReportHandler = downloadMissionReportHandler;
exports.getReportFileHandler = getReportFileHandler;
const report_service_1 = require("../services/report.service");
async function createMissionReportHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const format = req.body?.format || req.query?.format || 'csv';
        const username = req.user?.name || req.user?.username || 'Cdr. A. Fernando';
        const result = await (0, report_service_1.createMissionReport)(missionId, format, username);
        res.status(200).json({
            url: result.url,
        });
    }
    catch (error) {
        if (error.message === 'Mission not found') {
            res.status(404).json({ error: 'Mission not found', statusCode: 404 });
            return;
        }
        next(error);
    }
}
async function downloadMissionReportHandler(req, res, next) {
    try {
        const { missionId } = req.params;
        const format = req.query?.format || 'csv';
        const result = await (0, report_service_1.getMissionReportDownloadUrl)(missionId, format);
        res.status(200).json({
            url: result.url,
        });
    }
    catch (error) {
        if (error.message === 'Mission not found') {
            res.status(404).json({ error: 'Mission not found', statusCode: 404 });
            return;
        }
        next(error);
    }
}
async function getReportFileHandler(req, res, next) {
    try {
        const { reportId } = req.params;
        const file = await (0, report_service_1.getReportFileById)(reportId);
        if (!file) {
            res.status(404).json({ error: 'Report file not found', statusCode: 404 });
            return;
        }
        if (file.format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${reportId}.csv"`);
        }
        else if (file.format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${reportId}.json"`);
        }
        res.sendFile(file.fullPath);
    }
    catch (error) {
        next(error);
    }
}
