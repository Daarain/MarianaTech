"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = getHealthStatus;
const database_1 = require("../config/database");
const env_1 = require("../config/env");
function getHealthStatus() {
    const connected = (0, database_1.isDatabaseConnected)();
    return {
        status: 'ok',
        database: connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        service: env_1.config.serviceName,
    };
}
