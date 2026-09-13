"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongooseOptions = void 0;
exports.sanitizeMongoUri = sanitizeMongoUri;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
exports.pingDatabase = pingDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
/**
 * Sanitizes MongoDB URI for logging to prevent credential leakage.
 */
function sanitizeMongoUri(uri) {
    if (!uri)
        return '[redacted]';
    return uri.replace(/\/\/(.*?)@/, '//***:***@');
}
/**
 * Reusable Mongoose connection configuration options.
 */
exports.mongooseOptions = {
    dbName: env_1.config.mongodbDbName,
    serverSelectionTimeoutMS: 5000,
    autoIndex: true,
};
let isConnectedState = false;
/**
 * Connects to MongoDB Atlas / Database on server startup.
 */
async function connectDatabase() {
    try {
        mongoose_1.default.set('strictQuery', true);
        mongoose_1.default.connection.on('connected', () => {
            isConnectedState = true;
            console.log(`[Database] MongoDB connection established. (URI: ${sanitizeMongoUri(env_1.config.mongodbUri)}, DB: ${env_1.config.mongodbDbName})`);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            isConnectedState = false;
            console.warn('[Database] MongoDB connection disconnected.');
        });
        mongoose_1.default.connection.on('error', (err) => {
            isConnectedState = false;
            console.error('[Database Error]', err.message);
        });
        const conn = await mongoose_1.default.connect(env_1.config.mongodbUri, exports.mongooseOptions);
        isConnectedState = true;
        return conn;
    }
    catch (error) {
        isConnectedState = false;
        console.warn(`[Database Warning] Could not connect to MongoDB at ${sanitizeMongoUri(env_1.config.mongodbUri)} (${error.message}).`);
        return mongoose_1.default;
    }
}
/**
 * Graceful shutdown database disconnector.
 */
async function disconnectDatabase() {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.connection.close();
        isConnectedState = false;
        console.log('[Database] MongoDB connection closed.');
    }
}
/**
 * Exposes database connection state for health checks.
 */
function isDatabaseConnected() {
    return mongoose_1.default.connection.readyState === 1 || isConnectedState;
}
/**
 * Performs a simple ping query against MongoDB to verify live database connectivity.
 */
async function pingDatabase() {
    try {
        if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
            const adminDb = mongoose_1.default.connection.db.admin();
            const pingResult = await adminDb.ping();
            return pingResult?.ok === 1;
        }
        return false;
    }
    catch (err) {
        console.error('[Database Ping Error]', err.message);
        return false;
    }
}
