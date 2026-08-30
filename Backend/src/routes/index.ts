import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './auth.routes';
import missionRoutes from './mission.routes';
import anomalyRoutes from './anomaly.routes';
import jobRoutes from './job.routes';

const router = Router();

router.use('/v1', healthRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/missions', missionRoutes);
router.use('/v1/anomalies', anomalyRoutes);
router.use('/v1/jobs', jobRoutes);

export default router;
