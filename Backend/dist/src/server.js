"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const seed_1 = require("./utils/seed");
const seedAnomalies_1 = require("./utils/seedAnomalies");
const sonarWorker_1 = require("./workers/sonarWorker");
const server = http_1.default.createServer(app_1.default);
async function startServer() {
    // Connect to MongoDB
    await (0, database_1.connectDatabase)();
    // Seed default development users and demo anomalies
    await (0, seed_1.seedInitialUsers)();
    await (0, seedAnomalies_1.seedDemoAnomalies)();
    // Initialize BullMQ background worker
    (0, sonarWorker_1.initializeSonarWorker)();
    // Listen on configured port
    server.listen(env_1.config.port, () => {
        console.log(`==================================================`);
        console.log(`Service: ${env_1.config.serviceName}`);
        console.log(`Environment: ${env_1.config.env}`);
        console.log(`Server listening on port: ${env_1.config.port}`);
        console.log(`Health Endpoint: http://localhost:${env_1.config.port}/api/v1/health`);
        console.log(`Auth Login Endpoint: http://localhost:${env_1.config.port}/auth/login`);
        console.log(`==================================================`);
    });
}
async function gracefulShutdown(signal) {
    console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('[Server] Closed HTTP server.');
        try {
            await (0, database_1.disconnectDatabase)();
            console.log('[Server] Graceful shutdown complete.');
            process.exit(0);
        }
        catch (err) {
            console.error('[Server Error] Error during graceful shutdown:', err.message);
            process.exit(1);
        }
    });
    setTimeout(() => {
        console.error('[Server Error] Could not close connections in time, forcefully shutting down.');
        process.exit(1);
    }, 10000);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
startServer().catch((error) => {
    console.error('[Server Error] Failed to start server:', error);
    process.exit(1);
});
