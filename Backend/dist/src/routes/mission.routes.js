"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const mission_controller_1 = require("../controllers/mission.controller");
const missionFile_controller_1 = require("../controllers/missionFile.controller");
const anomaly_controller_1 = require("../controllers/anomaly.controller");
const processing_controller_1 = require("../controllers/processing.controller");
const report_controller_1 = require("../controllers/report.controller");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024,
    },
});
// Protect all mission routes with JWT authentication
router.use(auth_middleware_1.authenticateJWT);
// Static / stats routes first
router.get('/stats', mission_controller_1.getDashboardStats);
router.get('/', mission_controller_1.getMissions);
router.post('/', rateLimit_middleware_1.writeLimiter, mission_controller_1.createMission);
// Sub-resource endpoints on missionId
router.post('/:missionId/files', rateLimit_middleware_1.uploadLimiter, upload.single('file'), missionFile_controller_1.uploadMissionFileHandler);
router.get('/:missionId/files', missionFile_controller_1.getMissionFilesHandler);
router.get('/:missionId/anomalies/spatial', anomaly_controller_1.getMissionSpatialAnomaliesHandler);
router.get('/:missionId/anomalies', anomaly_controller_1.getMissionAnomaliesHandler);
router.post('/:missionId/process', rateLimit_middleware_1.processLimiter, processing_controller_1.processMissionHandler);
router.post('/:missionId/reports', rateLimit_middleware_1.reportLimiter, report_controller_1.createMissionReportHandler);
router.get('/:missionId/reports/download', report_controller_1.downloadMissionReportHandler);
// Generic single param route last to avoid greedy match conflicts
router.get('/:id', mission_controller_1.getMissionById);
exports.default = router;
