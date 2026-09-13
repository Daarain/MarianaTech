"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
exports.initRedisQueue = initRedisQueue;
exports.addJobToQueue = addJobToQueue;
exports.getIsRedisAvailable = getIsRedisAvailable;
exports.closeRedisQueue = closeRedisQueue;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
const QUEUE_NAME = 'sonar-processing';
exports.redisConnection = new ioredis_1.default({
    host: env_1.config.redisHost,
    port: env_1.config.redisPort,
    password: env_1.config.redisPassword || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: () => null, // Stop retrying if Redis is unavailable
});
// Suppress unhandled ioredis connection error logs during offline testing
exports.redisConnection.on('error', () => {
    // Silent handler
});
let sonarQueueInstance = null;
let isRedisAvailable = false;
async function initRedisQueue() {
    try {
        await exports.redisConnection.connect();
        isRedisAvailable = true;
        console.log(`[Redis] Connected to Redis server at ${env_1.config.redisHost}:${env_1.config.redisPort}`);
        sonarQueueInstance = new bullmq_1.Queue(QUEUE_NAME, {
            connection: exports.redisConnection,
        });
        return true;
    }
    catch (err) {
        isRedisAvailable = false;
        return false;
    }
}
// Trigger initial async connect
initRedisQueue();
async function addJobToQueue(data) {
    if (isRedisAvailable && sonarQueueInstance) {
        try {
            await sonarQueueInstance.add('process-sonar-mission', data, {
                jobId: data.jobId,
                removeOnComplete: 100,
                removeOnFail: 500,
            });
            return true;
        }
        catch (err) {
            console.warn(`[Queue Error] Failed adding job to BullMQ: ${err.message}. Triggering fallback handler.`);
        }
    }
    return false;
}
function getIsRedisAvailable() {
    return isRedisAvailable;
}
async function closeRedisQueue() {
    try {
        if (sonarQueueInstance) {
            await sonarQueueInstance.close();
        }
        if (exports.redisConnection.status === 'ready' || exports.redisConnection.status === 'connecting') {
            await exports.redisConnection.quit();
        }
    }
    catch (e) {
        // Ignore close errors
    }
}
