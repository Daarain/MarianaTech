import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
}
