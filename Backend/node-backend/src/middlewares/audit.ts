import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuditLog } from '../models/AuditLog';

export function logAudit(action: string, entityType: 'Mission' | 'Anomaly' | 'Auth' | 'Report') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLog.create({
          user_id: req.user?.id,
          action,
          entity_type: entityType,
          entity_id: req.params.id || req.params.missionId || req.params.anomalyId,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: req.body,
          },
          ip_address: req.ip || req.socket.remoteAddress,
          timestamp: new Date(),
        }).catch((err) => console.error('[AuditLog Error]', err.message));
      }
    });
    next();
  };
}
