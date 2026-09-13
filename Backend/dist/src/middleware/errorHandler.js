"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const env_1 = require("../config/env");
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    const message = err.message || 'Internal Server Error';
    console.error(`[Error ${statusCode}]`, err);
    res.status(statusCode).json({
        error: message,
        statusCode,
        timestamp: new Date().toISOString(),
        stack: env_1.config.env === 'development' ? err.stack : undefined,
    });
}
