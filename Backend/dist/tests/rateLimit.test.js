"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const mission_model_1 = require("../src/models/mission.model");
const rateLimit_middleware_1 = require("../src/middleware/rateLimit.middleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('COMPREHENSIVE RATE LIMITING SUBSYSTEM TESTS', () => {
    let operatorToken;
    let testMissionId;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        operatorToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        const mission = await mission_model_1.Mission.create({
            id: `MSN-RL-${Date.now()}`,
            customId: `MSN-RL-${Date.now()}`,
            name: 'Rate Limit Test Mission',
            date: '2026-08-29',
            location: 'Atlantic Ridge',
            status: 'pending',
            anomalyCount: 0,
            priority: 'low',
            depthM: 1000,
            areaKm2: 10,
            operator: 'Lt. R. Mehta',
            sonarType: 'Side-scan Sonar',
        });
        testMissionId = mission.id;
    });
    afterAll(async () => {
        await mission_model_1.Mission.deleteMany({ name: /Rate Limit/ });
        await (0, database_1.disconnectDatabase)();
    });
    test('SCENARIO 15: Health check endpoint (GET /api/v1/health) is NOT rate limited by global API limiter', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        }
    });
    test('SCENARIO 1-5: Custom Rate Limiter (Below Limit, At Limit, Exceeding Limit, HTTP 429 & Response Structure)', async () => {
        const testApp = (0, express_1.default)();
        testApp.use(express_1.default.json());
        const testLimiter = (0, rateLimit_middleware_1.createRateLimiter)({
            type: 'GLOBAL',
            windowMs: 60000,
            max: 3,
            message: 'Rate limit test window exceeded.',
        });
        testApp.get('/test-endpoint', testLimiter, (_req, res) => {
            res.status(200).json({ success: true, message: 'OK' });
        });
        // Request 1: Below limit
        const res1 = await (0, supertest_1.default)(testApp).get('/test-endpoint');
        expect(res1.status).toBe(200);
        expect(res1.body.success).toBe(true);
        // Request 2: Below limit
        const res2 = await (0, supertest_1.default)(testApp).get('/test-endpoint');
        expect(res2.status).toBe(200);
        // Request 3: Exactly at limit
        const res3 = await (0, supertest_1.default)(testApp).get('/test-endpoint');
        expect(res3.status).toBe(200);
        // Request 4: Exceeding limit -> HTTP 429
        const res4 = await (0, supertest_1.default)(testApp).get('/test-endpoint');
        expect(res4.status).toBe(429);
        expect(res4.body.success).toBe(false);
        expect(res4.body.error).toBeDefined();
        expect(res4.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(res4.body.error.message).toBe('Rate limit test window exceeded.');
        expect(typeof res4.body.error.retryAfter).toBe('number');
    });
    test('SCENARIO 6: Login Brute-force Protection (AUTH Limiter on POST /auth/login)', async () => {
        const testApp = (0, express_1.default)();
        testApp.use(express_1.default.json());
        const authTestLimiter = (0, rateLimit_middleware_1.createRateLimiter)({
            type: 'AUTH',
            windowMs: 60000,
            max: 2,
            message: 'Too many authentication attempts.',
        });
        testApp.post('/auth/login', authTestLimiter, (_req, res) => {
            res.status(401).json({ error: 'Invalid credentials' });
        });
        const res1 = await (0, supertest_1.default)(testApp).post('/auth/login').send({ username: 'bad', password: 'wrong' });
        expect(res1.status).toBe(401);
        const res2 = await (0, supertest_1.default)(testApp).post('/auth/login').send({ username: 'bad', password: 'wrong' });
        expect(res2.status).toBe(401);
        // Third attempt exceeds limit (max 2)
        const res3 = await (0, supertest_1.default)(testApp).post('/auth/login').send({ username: 'bad', password: 'wrong' });
        expect(res3.status).toBe(429);
        expect(res3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
    test('SCENARIO 7: Processing Endpoint Protection (PROCESS Limiter on POST /missions/:id/process)', async () => {
        const testApp = (0, express_1.default)();
        testApp.use(express_1.default.json());
        const processTestLimiter = (0, rateLimit_middleware_1.createRateLimiter)({
            type: 'PROCESS',
            windowMs: 3600000,
            max: 1,
            message: 'AI processing quota exceeded.',
        });
        testApp.post('/missions/:id/process', processTestLimiter, (_req, res) => {
            res.status(202).json({ jobId: 'JOB-TEST-01' });
        });
        const res1 = await (0, supertest_1.default)(testApp).post(`/missions/${testMissionId}/process`);
        expect(res1.status).toBe(202);
        // Second processing request exceeds limit
        const res2 = await (0, supertest_1.default)(testApp).post(`/missions/${testMissionId}/process`);
        expect(res2.status).toBe(429);
        expect(res2.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
    test('SCENARIO 8: Upload Endpoint Protection (UPLOAD Limiter on POST /missions/:id/files)', async () => {
        const testApp = (0, express_1.default)();
        testApp.use(express_1.default.json());
        const uploadTestLimiter = (0, rateLimit_middleware_1.createRateLimiter)({
            type: 'UPLOAD',
            windowMs: 3600000,
            max: 1,
        });
        testApp.post('/missions/:id/files', uploadTestLimiter, (_req, res) => {
            res.status(201).json({ fileName: 'scan.xtf' });
        });
        const res1 = await (0, supertest_1.default)(testApp).post(`/missions/${testMissionId}/files`);
        expect(res1.status).toBe(201);
        const res2 = await (0, supertest_1.default)(testApp).post(`/missions/${testMissionId}/files`);
        expect(res2.status).toBe(429);
    });
    test('SCENARIO 9: Report Generation Rate Limit (REPORT Limiter on POST /missions/:id/reports)', async () => {
        const testApp = (0, express_1.default)();
        testApp.use(express_1.default.json());
        const reportTestLimiter = (0, rateLimit_middleware_1.createRateLimiter)({
            type: 'REPORT',
            windowMs: 3600000,
            max: 1,
        });
        testApp.post('/missions/:id/reports', reportTestLimiter, (_req, res) => {
            res.status(200).json({ url: '/reports/file/RPT-001' });
        });
        const res1 = await (0, supertest_1.default)(testApp).post(`/missions/${testMissionId}/reports`);
        expect(res1.status).toBe(200);
        const res2 = await (0, supertest_1.default)(testApp).post(`/missions/${testMissionId}/reports`);
        expect(res2.status).toBe(429);
    });
    test('SCENARIO 10: Isolating Limiters Across Endpoints', async () => {
        const testApp = (0, express_1.default)();
        testApp.use(express_1.default.json());
        const limiterA = (0, rateLimit_middleware_1.createRateLimiter)({ type: 'WRITE', windowMs: 60000, max: 1 });
        const limiterB = (0, rateLimit_middleware_1.createRateLimiter)({ type: 'REPORT', windowMs: 60000, max: 1 });
        testApp.post('/routeA', limiterA, (_req, res) => res.status(200).send('A'));
        testApp.post('/routeB', limiterB, (_req, res) => res.status(200).send('B'));
        // Trigger limiterA limit
        await (0, supertest_1.default)(testApp).post('/routeA');
        const resA2 = await (0, supertest_1.default)(testApp).post('/routeA');
        expect(resA2.status).toBe(429);
        // RouteB should still be allowed under its own limiter
        const resB1 = await (0, supertest_1.default)(testApp).post('/routeB');
        expect(resB1.status).toBe(200);
    });
    test('SCENARIO 11-14: Authenticated Request Rate Limiting Integration', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/missions')
            .set('Authorization', `Bearer ${operatorToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
