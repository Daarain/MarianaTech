import { Request, Response, NextFunction } from 'express';
import {
  triggerMissionProcessing,
  getProcessingJobDetails,
  retryProcessingJob,
} from '../services/processing.service';

export async function processMissionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;
    const job = await triggerMissionProcessing(missionId);
    res.status(202).json(job);
  } catch (error: any) {
    if (error.message === 'MISSION_NOT_FOUND') {
      res.status(404).json({ error: 'Mission not found', statusCode: 404 });
      return;
    }
    if (error.message === 'MISSION_ALREADY_PROCESSING') {
      res.status(400).json({ error: 'Mission is already being processed or completed', statusCode: 400 });
      return;
    }
    next(error);
  }
}

export async function getJobDetailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobId } = req.params;
    const job = await getProcessingJobDetails(jobId);
    if (!job) {
      res.status(404).json({ error: 'Processing job not found', statusCode: 404 });
      return;
    }
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
}

export async function retryJobHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobId } = req.params;
    const job = await retryProcessingJob(jobId);
    res.status(200).json(job);
  } catch (error: any) {
    if (error.message === 'JOB_NOT_FOUND') {
      res.status(404).json({ error: 'Processing job not found', statusCode: 404 });
      return;
    }
    next(error);
  }
}
