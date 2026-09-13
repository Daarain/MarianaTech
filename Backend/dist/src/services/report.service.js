"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCSVReport = buildCSVReport;
exports.buildJSONReport = buildJSONReport;
exports.createMissionReport = createMissionReport;
exports.getMissionReportDownloadUrl = getMissionReportDownloadUrl;
exports.getReportFileById = getReportFileById;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mission_model_1 = require("../models/mission.model");
const anomaly_model_1 = require("../models/anomaly.model");
const processingRun_model_1 = require("../models/processingRun.model");
const report_model_1 = require("../models/report.model");
function buildCSVReport(mission, run, anomalies) {
    const lines = [];
    lines.push('# MarianaTech Side-scan Sonar Mission Intelligence Report');
    lines.push(`# Generated At: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('# MISSION SUMMARY');
    lines.push('Mission ID,Mission Name,Status,Date,Location,Vessel,Operator,Sonar Type,Processing Run ID,Model Version,Anomaly Count');
    lines.push(`"${mission.id || mission.customId}","${mission.name}","${mission.status}","${mission.date}","${mission.location}","${mission.vessel || ''}","${mission.operator || ''}","${mission.sonarType || ''}","${run?.runId || 'N/A'}","${run?.modelVersion || 'v1.0.0'}",${anomalies.length}`);
    lines.push('');
    lines.push('# DETECTED ACOUSTIC ANOMALIES');
    lines.push('Anomaly ID,Class Name,Confidence,Priority,Latitude,Longitude,Depth (m),Size (m),Verification Status,Description');
    for (const a of anomalies) {
        lines.push(`"${a.id || a.customId}","${a.className}","${a.confidence}","${a.priority}","${a.latitude ?? ''}","${a.longitude ?? ''}","${a.depthM}","${a.sizeM}","${a.status}","${(a.description || '').replace(/"/g, '""')}"`);
    }
    return lines.join('\n');
}
function buildJSONReport(mission, run, anomalies) {
    return JSON.stringify({
        reportTitle: 'MarianaTech Side-scan Sonar Mission Intelligence Report',
        generatedAt: new Date().toISOString(),
        mission: {
            id: mission.id || mission.customId,
            name: mission.name,
            status: mission.status,
            date: mission.date,
            location: mission.location,
            vessel: mission.vessel,
            operator: mission.operator,
            sonarType: mission.sonarType,
            depthM: mission.depthM,
            areaKm2: mission.areaKm2,
            anomalyCount: anomalies.length,
        },
        processingRun: {
            runId: run?.runId || 'N/A',
            jobId: run?.jobId || 'N/A',
            modelVersion: run?.modelVersion || 'v1.0.0',
            preprocessingVersion: run?.preprocessingVersion || 'v1.0',
            status: run?.status || 'completed',
            completedAt: run?.completedAt || new Date(),
        },
        anomalies: anomalies.map((a) => ({
            id: a.id || a.customId,
            className: a.className,
            confidence: a.confidence,
            priority: a.priority,
            latitude: a.latitude,
            longitude: a.longitude,
            depthM: a.depthM,
            sizeM: a.sizeM,
            status: a.status,
            description: a.description,
            boundingBox: a.boundingBox,
        })),
    }, null, 2);
}
async function createMissionReport(missionId, requestedFormat = 'csv', createdBy = 'system') {
    const mission = await mission_model_1.Mission.findOne({
        $or: [{ id: missionId }, { customId: missionId }],
    });
    if (!mission) {
        throw new Error('Mission not found');
    }
    const format = requestedFormat.toLowerCase() === 'json' ? 'json' : 'csv';
    const run = await processingRun_model_1.ProcessingRunModel.findOne({ missionId }).sort({ createdAt: -1 });
    const anomalies = await anomaly_model_1.AnomalyModel.find({ missionId }).sort({ createdAt: -1 });
    let reportContent = '';
    if (format === 'csv') {
        reportContent = buildCSVReport(mission, run, anomalies);
    }
    else {
        reportContent = buildJSONReport(mission, run, anomalies);
    }
    const reportId = `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dirPath = path_1.default.join(process.cwd(), 'uploads', 'reports', missionId);
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
    const filename = `${reportId}.${format}`;
    const fullPath = path_1.default.join(dirPath, filename);
    await fs_1.default.promises.writeFile(fullPath, reportContent, 'utf-8');
    const relativePath = path_1.default.relative(process.cwd(), fullPath).replace(/\\/g, '/');
    await report_model_1.ReportModel.create({
        reportId,
        missionId,
        format,
        storagePath: relativePath,
        status: 'completed',
        createdBy,
    });
    const url = `/reports/file/${reportId}`;
    return {
        reportId,
        format,
        url,
        storagePath: relativePath,
    };
}
async function getMissionReportDownloadUrl(missionId, requestedFormat = 'csv') {
    const format = requestedFormat.toLowerCase() === 'json' ? 'json' : 'csv';
    let report = await report_model_1.ReportModel.findOne({ missionId, format }).sort({ createdAt: -1 });
    if (!report) {
        const generated = await createMissionReport(missionId, format);
        return {
            url: generated.url,
            reportId: generated.reportId,
            storagePath: generated.storagePath,
            format: generated.format,
        };
    }
    return {
        url: `/reports/file/${report.reportId}`,
        reportId: report.reportId,
        storagePath: report.storagePath,
        format: report.format,
    };
}
async function getReportFileById(reportId) {
    const report = await report_model_1.ReportModel.findOne({ reportId });
    if (!report)
        return null;
    const fullPath = path_1.default.join(process.cwd(), report.storagePath);
    if (!fs_1.default.existsSync(fullPath))
        return null;
    return {
        fullPath,
        format: report.format,
    };
}
