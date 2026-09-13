"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
function notFoundHandler(req, res, _next) {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
    });
}
