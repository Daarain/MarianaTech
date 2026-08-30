import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error('[API Error]', err);
  const statusCode = err.statusCode || res.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode === 200 ? 500 : statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
