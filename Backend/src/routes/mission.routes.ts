import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getMissions,
  getMissionById,
  createMission,
  getDashboardStats,
} from '../controllers/mission.controller';
import {
  uploadMissionFileHandler,
  getMissionFilesHandler,
} from '../controllers/missionFile.controller';
import {
  getMissionAnomaliesHandler,
  getMissionSpatialAnomaliesHandler,
} from '../controllers/anomaly.controller';
import { processMissionHandler } from '../controllers/processing.controller';
import {
  createMissionReportHandler,
  downloadMissionReportHandler,
} from '../controllers/report.controller';
import {
  writeLimiter,
  uploadLimiter,
  processLimiter,
  reportLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

// Protect all mission routes with JWT authentication
router.use(authenticateJWT);

// Static / stats routes first
router.get('/stats', getDashboardStats);
router.get('/', getMissions);
router.post('/', writeLimiter, createMission);

// Sub-resource endpoints on missionId
router.post('/:missionId/files', uploadLimiter, upload.single('file'), uploadMissionFileHandler);
router.get('/:missionId/files', getMissionFilesHandler);

router.get('/:missionId/anomalies/spatial', getMissionSpatialAnomaliesHandler);
router.get('/:missionId/anomalies', getMissionAnomaliesHandler);

router.post('/:missionId/process', processLimiter, processMissionHandler);

router.post('/:missionId/reports', reportLimiter, createMissionReportHandler);
router.get('/:missionId/reports/download', downloadMissionReportHandler);

// Generic single param route last to avoid greedy match conflicts
router.get('/:id', getMissionById);

export default router;
