import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'admin' | 'operator';
    name: string;
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // If no header provided, we allow mock/default fallback user for optional routes or return 401 if strict
    // For production REST API:
    const token = req.query.token as string;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        req.user = decoded;
        return next();
      } catch {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorizeRoles(roles: Array<'admin' | 'operator'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
