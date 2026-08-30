import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../models/user.model';

export interface AuthenticatedUserPayload {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Middleware to authenticate requests using JWT tokens.
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({
      error: 'Authentication token required',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Invalid or expired authentication token',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware to authorize specific user roles.
 */
export function authorizeRoles(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: insufficient permissions',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
