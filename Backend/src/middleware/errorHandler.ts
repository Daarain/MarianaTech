import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { config } from '../config/env';

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  console.error(`[Error ${statusCode}]`, err);

  res.status(statusCode).json({
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    stack: config.env === 'development' ? err.stack : undefined,
  });
}
