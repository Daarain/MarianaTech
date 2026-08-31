import { Request, Response, NextFunction } from 'express';
import {
  fetchAnomaliesByMission,
  fetchAnomalyById,
  updateVerifyAnomaly,
  updateRejectAnomaly,
  fetchAnomalyHistory,
  fetchAnomaliesNear,
  fetchAnomaliesWithinRadius,
  fetchAnomaliesInMissionArea,
} from '../services/anomaly.service';

export async function getMissionAnomaliesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;
    const anomalies = await fetchAnomaliesByMission(missionId);
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
}

export async function getAnomalyByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { anomalyId } = req.params;
    const anomaly = await fetchAnomalyById(anomalyId);
    if (!anomaly) {
      res.status(404).json({ error: 'Anomaly not found', statusCode: 404 });
      return;
    }
    res.status(200).json(anomaly);
  } catch (error) {
    next(error);
  }
}

export async function verifyAnomalyHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { anomalyId } = req.params;
    const { comment, status } = req.body || {};
    const username = (req as any).user?.name || (req as any).user?.username;

    const updated = await updateVerifyAnomaly(anomalyId, username, comment || '', status || 'verified');
    if (!updated) {
      res.status(404).json({ error: 'Anomaly not found', statusCode: 404 });
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function rejectAnomalyHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { anomalyId } = req.params;
    const { comment } = req.body || {};
    const username = (req as any).user?.name || (req as any).user?.username;

    const updated = await updateRejectAnomaly(anomalyId, username, comment || '');
    if (!updated) {
      res.status(404).json({ error: 'Anomaly not found', statusCode: 404 });
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function getAnomalyHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { anomalyId } = req.params;
    const history = await fetchAnomalyHistory(anomalyId);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
}

/**
 * STEP 12: Geospatial Handlers
 */

export async function getAnomaliesNearHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lng = parseFloat(req.query.lng as string);
    const lat = parseFloat(req.query.lat as string);
    const maxDistanceMeters = req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : 50000;

    if (isNaN(lng) || isNaN(lat)) {
      res.status(400).json({ error: 'Invalid or missing lng/lat query parameters', statusCode: 400 });
      return;
    }

    const anomalies = await fetchAnomaliesNear(lng, lat, maxDistanceMeters);
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
}

export async function getAnomaliesWithinHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lng = parseFloat(req.query.lng as string);
    const lat = parseFloat(req.query.lat as string);
    const radiusKm = parseFloat((req.query.radiusKm || req.query.radius) as string);

    if (isNaN(lng) || isNaN(lat) || isNaN(radiusKm)) {
      res.status(400).json({ error: 'Invalid or missing lng/lat/radiusKm query parameters', statusCode: 400 });
      return;
    }

    const anomalies = await fetchAnomaliesWithinRadius(lng, lat, radiusKm);
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
}

export async function getMissionSpatialAnomaliesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;
    const anomalies = await fetchAnomaliesInMissionArea(missionId);
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
}
