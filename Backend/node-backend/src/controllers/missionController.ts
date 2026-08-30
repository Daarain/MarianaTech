import { Request, Response, NextFunction } from 'express';
import {
  getAllMissions,
  getMissionById as fetchMissionById,
  createNewMission,
  calculateDashboardStats,
} from '../services/missionService';

export async function getMissions(_req: Request, res: Response, next: NextFunction) {
  try {
    const missions = await getAllMissions();
    res.json(missions);
  } catch (err) {
    next(err);
  }
}

export async function getMissionById(req: Request, res: Response, next: NextFunction) {
  try {
    const mission = await fetchMissionById(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  } catch (err) {
    next(err);
  }
}

export async function createMission(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body;
    if (!payload.missionName) {
      return res.status(400).json({ error: 'Mission name is required' });
    }
    const result = await createNewMission(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await calculateDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
