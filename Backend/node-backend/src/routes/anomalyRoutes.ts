import { Router } from 'express';
import { verifyAnomaly, rejectAnomaly } from '../controllers/anomalyController';
import { logAudit } from '../middlewares/audit';

const router = Router();

router.post('/:anomalyId/verify', logAudit('verify_anomaly', 'Anomaly'), verifyAnomaly);
router.post('/:anomalyId/reject', logAudit('reject_anomaly', 'Anomaly'), rejectAnomaly);

export default router;
