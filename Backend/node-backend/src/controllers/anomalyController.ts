import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import {
  getAnomaliesForMission,
  verifyAnomalyStatus,
  rejectAnomalyStatus,
} from '../services/anomalyService';

export async function getAnomalies(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { missionId } = req.params;
    const anomalies = await getAnomaliesForMission(missionId);
    res.json(anomalies);
  } catch (err) {
    next(err);
  }
}

export async function verifyAnomaly(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { anomalyId } = req.params;
    const updated = await verifyAnomalyStatus(anomalyId, req.user?.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function rejectAnomaly(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { anomalyId } = req.params;
    const updated = await rejectAnomalyStatus(anomalyId, req.user?.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
