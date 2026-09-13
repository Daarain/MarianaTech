"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const seed_1 = require("../src/utils/seed");
describe('Authentication API Endpoint Tests', () => {
    let adminToken = '';
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await (0, seed_1.seedInitialUsers)();
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('POST /auth/login should authenticate admin and return frontend-compatible payload', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user', 'Cdr. A. Fernando');
        expect(res.body).toHaveProperty('role', 'admin');
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        expect(res.body).not.toHaveProperty('passwordHash');
        adminToken = res.body.token;
    });
    it('POST /auth/login should authenticate operator and return frontend-compatible payload', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send({ username: 'operator', password: 'operator123' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user', 'Lt. R. Mehta');
        expect(res.body).toHaveProperty('role', 'operator');
        expect(res.body).toHaveProperty('token');
    });
    it('POST /auth/register should create a user with a hashed password and allow login', async () => {
        const username = `newoperator_${Date.now()}`;
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send({ name: 'New Operator', username, password: 'newpass123' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('username', username);
        expect(res.body.user).toHaveProperty('role', 'operator');
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send({ username, password: 'newpass123' });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty('role', 'operator');
        expect(loginRes.body).toHaveProperty('token');
    });
    it('POST /auth/login should fail for invalid password', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/auth/login')
            .send({ username: 'admin', password: 'wrongpassword' });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
    it('GET /auth/me should return authenticated user profile with ******', async () => {
        const token = adminToken;
        const meRes = await (0, supertest_1.default)(app_1.default)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);
        expect(meRes.status).toBe(200);
        expect(meRes.body).toHaveProperty('username', 'admin');
        expect(meRes.body).toHaveProperty('role', 'admin');
        expect(meRes.body).not.toHaveProperty('passwordHash');
    });
    it('GET /auth/me should reject requests without token', async () => {
        const meRes = await (0, supertest_1.default)(app_1.default).get('/auth/me');
        expect(meRes.status).toBe(401);
    });
    it('POST /auth/logout should return 200 OK', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });
});
