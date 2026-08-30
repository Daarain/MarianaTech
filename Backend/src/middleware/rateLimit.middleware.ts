import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { redisConnection, getIsRedisAvailable } from '../queue/sonarQueue';
import { AuthenticatedRequest } from './auth.middleware';

export type LimiterType =
  | 'GLOBAL'
  | 'AUTH'
  | 'WRITE'
  | 'PROCESS'
  | 'UPLOAD'
  | 'REPORT';

interface CreateLimiterOptions {
  type: LimiterType;
  windowMs: number;
  max: number;
  message?: string;
  skip?: (req: Request) => boolean;
}

/**
 * Creates a rate limiter store backed by Redis (multi-instance production)
 * or in-memory fallback (single-instance / dev / test mode).
 */
function getRateLimitStore(prefix: string) {
  if (getIsRedisAvailable() && redisConnection && process.env.NODE_ENV !== 'test') {
    try {
      return new RedisStore({
        // Send command wrapper for ioredis client
        sendCommand: async (...args: string[]) => {
          return (redisConnection as any).call(args[0], ...args.slice(1));
        },
        prefix: `marianatech:rl:${prefix}:`,
      });
    } catch (err: any) {
      console.warn(`[RateLimit Warning] Failed to initialize RedisStore for prefix '${prefix}':`, err.message);
    }
  }
  return undefined; // MemoryStore fallback
}

/**
 * Audit log helper for rate limit exceed security events.
 */
function logRateLimitSecurityEvent(req: Request, limiterType: LimiterType): void {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id || authReq.user?.username || 'ANONYMOUS';

  const securityLog = {
    event: 'RATE_LIMIT_EXCEEDED',
    limiterType,
    timestamp: new Date().toISOString(),
    endpoint: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip || req.socket.remoteAddress || 'UNKNOWN_IP',
    userId,
    status: 429,
  };

  console.warn(`[Security Alert] Rate limit exceeded:`, JSON.stringify(securityLog));
}

/**
 * Creates a configured express-rate-limit middleware instance.
 */
export function createRateLimiter(options: CreateLimiterOptions): RateLimitRequestHandler {
  const { type, windowMs, max, message, skip } = options;

  const retryAfterSec = Math.ceil(windowMs / 1000);

  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    store: getRateLimitStore(type.toLowerCase()),
    skip: (req: Request) => {
      if (!config.rateLimitEnabled) return true;
      if (skip && skip(req)) return true;
      return false;
    },
    handler: (req: Request, res: Response, _next: NextFunction) => {
      logRateLimitSecurityEvent(req, type);

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests. Please try again later.',
          retryAfter: retryAfterSec,
        },
      });
    },
  });
}

// =========================================================================
// PRE-CONFIGURED LIMITERS FOR MARIANATECH SUBSYSTEMS
// =========================================================================

/**
 * A. Global API Limiter
 * Default: 100 requests per 15 minutes per IP.
 * Bypasses health check endpoint.
 */
export const globalLimiter = createRateLimiter({
  type: 'GLOBAL',
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many requests. Please try again later.',
  skip: (req: Request) => {
    // Health check endpoint must not be restricted by global API limit
    return req.path === '/api/v1/health' || req.originalUrl === '/api/v1/health';
  },
});

/**
 * B. Authentication Rate Limiter
 * Default: 5 login attempts per 15 minutes per IP.
 * Applied to POST /auth/login, POST /auth/register, POST /auth/refresh.
 */
export const authLimiter = createRateLimiter({
  type: 'AUTH',
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

/**
 * C. Write-Operation Rate Limiter
 * Default: 30 write requests per 15 minutes per IP.
 * Applied to POST /missions, POST /anomalies/:id/verify, etc.
 */
export const writeLimiter = createRateLimiter({
  type: 'WRITE',
  windowMs: config.writeRateLimitWindowMs,
  max: config.writeRateLimitMax,
  message: 'Too many write requests. Please try again later.',
});

/**
 * D. AI Processing Job Rate Limiter
 * Default: 10 processing requests per hour per IP.
 * Applied to POST /missions/:missionId/process.
 */
export const processLimiter = createRateLimiter({
  type: 'PROCESS',
  windowMs: config.processRateLimitWindowMs,
  max: config.processRateLimitMax,
  message: 'AI processing request limit reached. Please try again in an hour.',
});

/**
 * E. File Upload Rate Limiter
 * Default: 20 file upload requests per hour per IP.
 * Applied to POST /missions/:missionId/files.
 */
export const uploadLimiter = createRateLimiter({
  type: 'UPLOAD',
  windowMs: config.uploadRateLimitWindowMs,
  max: config.uploadRateLimitMax,
  message: 'File upload quota exceeded. Please try again in an hour.',
});

/**
 * F. Report Generation Rate Limiter
 * Default: 10 report requests per hour per IP.
 * Applied to POST /missions/:missionId/reports.
 */
export const reportLimiter = createRateLimiter({
  type: 'REPORT',
  windowMs: config.reportRateLimitWindowMs,
  max: config.reportRateLimitMax,
  message: 'Report generation quota exceeded. Please try again in an hour.',
});
