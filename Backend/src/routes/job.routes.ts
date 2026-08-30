import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getJobDetailsHandler, retryJobHandler } from '../controllers/processing.controller';
import { writeLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/:jobId', getJobDetailsHandler);
router.post('/:jobId/retry', writeLimiter, retryJobHandler);

export default router;
