import { Request, Response, NextFunction } from 'express';
import { getHealthStatus } from '../services/healthService';

export function getHealth(_req: Request, res: Response, next: NextFunction): void {
  try {
    const status = getHealthStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}
