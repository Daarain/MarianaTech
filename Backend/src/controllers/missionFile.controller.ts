import { Request, Response, NextFunction } from 'express';
import { uploadMissionFileRecord, getFilesForMission } from '../services/missionFile.service';
import { fetchMissionById } from '../services/mission.service';

export async function uploadMissionFileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;

    const mission = await fetchMissionById(missionId);
    if (!mission) {
      res.status(404).json({ error: 'Mission not found', statusCode: 404 });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded', statusCode: 400 });
      return;
    }

    const fileDoc = await uploadMissionFileRecord(missionId, req.file);
    res.status(201).json(fileDoc);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'File upload failed',
      statusCode: 400,
    });
  }
}

export async function getMissionFilesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;
    const files = await getFilesForMission(missionId);
    res.status(200).json(files);
  } catch (error) {
    next(error);
  }
}
