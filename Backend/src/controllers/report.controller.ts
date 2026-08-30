import { Request, Response, NextFunction } from 'express';
import {
  createMissionReport,
  getMissionReportDownloadUrl,
  getReportFileById,
} from '../services/report.service';

export async function createMissionReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;
    const format = req.body?.format || req.query?.format || 'csv';
    const username = (req as any).user?.name || (req as any).user?.username || 'Cdr. A. Fernando';

    const result = await createMissionReport(missionId, format, username);

    res.status(200).json({
      url: result.url,
    });
  } catch (error: any) {
    if (error.message === 'Mission not found') {
      res.status(404).json({ error: 'Mission not found', statusCode: 404 });
      return;
    }
    next(error);
  }
}

export async function downloadMissionReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { missionId } = req.params;
    const format = (req.query?.format as string) || 'csv';

    const result = await getMissionReportDownloadUrl(missionId, format);

    res.status(200).json({
      url: result.url,
    });
  } catch (error: any) {
    if (error.message === 'Mission not found') {
      res.status(404).json({ error: 'Mission not found', statusCode: 404 });
      return;
    }
    next(error);
  }
}

export async function getReportFileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { reportId } = req.params;
    const file = await getReportFileById(reportId);

    if (!file) {
      res.status(404).json({ error: 'Report file not found', statusCode: 404 });
      return;
    }

    if (file.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportId}.csv"`);
    } else if (file.format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${reportId}.json"`);
    }

    res.sendFile(file.fullPath);
  } catch (error) {
    next(error);
  }
}
