import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getAnomalyByIdHandler,
  verifyAnomalyHandler,
  rejectAnomalyHandler,
  getAnomalyHistoryHandler,
  getAnomaliesNearHandler,
  getAnomaliesWithinHandler,
} from '../controllers/anomaly.controller';
import { writeLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/near', getAnomaliesNearHandler);
router.get('/within', getAnomaliesWithinHandler);
router.get('/:anomalyId/history', getAnomalyHistoryHandler);
router.post('/:anomalyId/verify', writeLimiter, verifyAnomalyHandler);
router.post('/:anomalyId/reject', writeLimiter, rejectAnomalyHandler);
router.get('/:anomalyId', getAnomalyByIdHandler);

export default router;
