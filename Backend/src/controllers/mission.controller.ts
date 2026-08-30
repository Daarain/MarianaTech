import { Request, Response, NextFunction } from 'express';
import {
  fetchAllMissions,
  fetchMissionById,
  createMissionRecord,
  getAggregateStats,
} from '../services/mission.service';

export async function getMissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const missions = await fetchAllMissions();
    res.status(200).json(missions);
  } catch (error) {
    next(error);
  }
}

export async function getMissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mission = await fetchMissionById(req.params.id);
    if (!mission) {
      res.status(404).json({ error: 'Mission not found', statusCode: 404 });
      return;
    }
    res.status(200).json(mission);
  } catch (error) {
    next(error);
  }
}

export async function createMission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    const result = await createMissionRecord(payload);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to create mission',
      statusCode: 400,
    });
  }
}

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getAggregateStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}
