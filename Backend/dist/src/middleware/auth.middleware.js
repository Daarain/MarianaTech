"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.authorizeRoles = authorizeRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Middleware to authenticate requests using JWT tokens.
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.query.token && typeof req.query.token === 'string') {
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
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (err) {
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
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
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
