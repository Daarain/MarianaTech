import { Request, Response, NextFunction } from 'express';
import { generateReportForMission, downloadReportFile } from '../services/reportService';

export async function generateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { missionId } = req.params;
    const format = (req.body.format || 'csv') as 'csv' | 'json' | 'pdf';
    const result = await generateReportForMission(missionId, format);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { missionId } = req.params;
    const filename = req.params.filename;

    if (filename) {
      const filePath = await downloadReportFile(filename);
      return res.download(filePath);
    }

    // Default generate & download CSV report if no specific filename requested
    const result = await generateReportForMission(missionId, 'csv');
    res.json(result);
  } catch (err) {
    next(err);
  }
}
