"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportLimiter = exports.uploadLimiter = exports.processLimiter = exports.writeLimiter = exports.authLimiter = exports.globalLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const env_1 = require("../config/env");
const sonarQueue_1 = require("../queue/sonarQueue");
/**
 * Creates a rate limiter store backed by Redis (multi-instance production)
 * or in-memory fallback (single-instance / dev / test mode).
 */
function getRateLimitStore(prefix) {
    if ((0, sonarQueue_1.getIsRedisAvailable)() && sonarQueue_1.redisConnection && process.env.NODE_ENV !== 'test') {
        try {
            return new rate_limit_redis_1.RedisStore({
                // Send command wrapper for ioredis client
                sendCommand: async (...args) => {
                    return sonarQueue_1.redisConnection.call(args[0], ...args.slice(1));
                },
                prefix: `marianatech:rl:${prefix}:`,
            });
        }
        catch (err) {
            console.warn(`[RateLimit Warning] Failed to initialize RedisStore for prefix '${prefix}':`, err.message);
        }
    }
    return undefined; // MemoryStore fallback
}
/**
 * Audit log helper for rate limit exceed security events.
 */
function logRateLimitSecurityEvent(req, limiterType) {
    const authReq = req;
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
function createRateLimiter(options) {
    const { type, windowMs, max, message, skip } = options;
    const retryAfterSec = Math.ceil(windowMs / 1000);
    return (0, express_rate_limit_1.default)({
        windowMs,
        limit: max,
        standardHeaders: true,
        legacyHeaders: false,
        store: getRateLimitStore(type.toLowerCase()),
        skip: (req) => {
            if (!env_1.config.rateLimitEnabled)
                return true;
            if (skip && skip(req))
                return true;
            return false;
        },
        handler: (req, res, _next) => {
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
exports.globalLimiter = createRateLimiter({
    type: 'GLOBAL',
    windowMs: env_1.config.rateLimitWindowMs,
    max: env_1.config.rateLimitMax,
    message: 'Too many requests. Please try again later.',
    skip: (req) => {
        // Health check endpoint must not be restricted by global API limit
        return req.path === '/api/v1/health' || req.originalUrl === '/api/v1/health';
    },
});
/**
 * B. Authentication Rate Limiter
 * Default: 5 login attempts per 15 minutes per IP.
 * Applied to POST /auth/login, POST /auth/register, POST /auth/refresh.
 */
exports.authLimiter = createRateLimiter({
    type: 'AUTH',
    windowMs: env_1.config.authRateLimitWindowMs,
    max: env_1.config.authRateLimitMax,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
});
/**
 * C. Write-Operation Rate Limiter
 * Default: 30 write requests per 15 minutes per IP.
 * Applied to POST /missions, POST /anomalies/:id/verify, etc.
 */
exports.writeLimiter = createRateLimiter({
    type: 'WRITE',
    windowMs: env_1.config.writeRateLimitWindowMs,
    max: env_1.config.writeRateLimitMax,
    message: 'Too many write requests. Please try again later.',
});
/**
 * D. AI Processing Job Rate Limiter
 * Default: 10 processing requests per hour per IP.
 * Applied to POST /missions/:missionId/process.
 */
exports.processLimiter = createRateLimiter({
    type: 'PROCESS',
    windowMs: env_1.config.processRateLimitWindowMs,
    max: env_1.config.processRateLimitMax,
    message: 'AI processing request limit reached. Please try again in an hour.',
});
/**
 * E. File Upload Rate Limiter
 * Default: 20 file upload requests per hour per IP.
 * Applied to POST /missions/:missionId/files.
 */
exports.uploadLimiter = createRateLimiter({
    type: 'UPLOAD',
    windowMs: env_1.config.uploadRateLimitWindowMs,
    max: env_1.config.uploadRateLimitMax,
    message: 'File upload quota exceeded. Please try again in an hour.',
});
/**
 * F. Report Generation Rate Limiter
 * Default: 10 report requests per hour per IP.
 * Applied to POST /missions/:missionId/reports.
 */
exports.reportLimiter = createRateLimiter({
    type: 'REPORT',
    windowMs: env_1.config.reportRateLimitWindowMs,
    max: env_1.config.reportRateLimitMax,
    message: 'Report generation quota exceeded. Please try again in an hour.',
});
