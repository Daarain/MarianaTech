import { Router } from 'express';
import {
  getMissions,
  getMissionById,
  createMission,
  getDashboardStats,
} from '../controllers/missionController';
import { getAnomalies } from '../controllers/anomalyController';
import { generateReport, downloadReport } from '../controllers/reportController';
import { logAudit } from '../middlewares/audit';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/', getMissions);
router.get('/:id', getMissionById);
router.post('/', logAudit('create_mission', 'Mission'), createMission);

// Nested routes expected by frontend contract
router.get('/:missionId/anomalies', getAnomalies);
router.post('/:missionId/reports', logAudit('generate_report', 'Report'), generateReport);
router.get('/:missionId/reports/download', downloadReport);

export default router;
