"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const mission_model_1 = require("../src/models/mission.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('Mission Management API Tests', () => {
    let createdMissionId;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('POST /missions should create a new mission and map payload correctly', async () => {
        const payload = {
            missionName: 'North Sea Wind Farm Survey',
            date: '2026-08-29',
            vessel: 'SV DeepScan I',
            location: 'Dogger Bank, North Sea',
            depthMin: 30,
            depthMax: 60,
            sonarType: 'Side-scan Sonar',
            notes: 'Routine cable route inspection.',
            operatorName: 'Lt. R. Mehta',
            files: [
                { name: 'northsea_scan01.xtf', size: 10485760 },
                { name: 'northsea_scan02.jsf', size: 20971520 },
            ],
        };
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/missions')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(typeof res.body.id).toBe('string');
        createdMissionId = res.body.id;
    });
    it('GET /missions should return a list of missions mapped to frontend expectations', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/missions')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        const m = res.body.find((item) => item.id === createdMissionId);
        expect(m).toBeDefined();
        expect(m).toHaveProperty('id', createdMissionId);
        expect(m).toHaveProperty('name', 'North Sea Wind Farm Survey');
        expect(m).toHaveProperty('date', '2026-08-29');
        expect(m).toHaveProperty('location', 'Dogger Bank, North Sea');
        expect(m).toHaveProperty('status', 'pending');
        expect(m).toHaveProperty('anomaly_count', 0);
        expect(m).toHaveProperty('priority', 'low');
        expect(m).toHaveProperty('depth_m', 45);
        expect(m).toHaveProperty('area_km2', 15);
        expect(m).toHaveProperty('operator', 'Lt. R. Mehta');
        expect(m).toHaveProperty('sonar_type', 'Side-scan Sonar');
    });
    it('GET /missions/:id should return single mission detail matching frontend model', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/missions/${createdMissionId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', createdMissionId);
        expect(res.body).toHaveProperty('name', 'North Sea Wind Farm Survey');
        expect(res.body).toHaveProperty('depth_m', 45);
        expect(res.body).toHaveProperty('operator', 'Lt. R. Mehta');
    });
    it('GET /missions/:id should return 404 for non-existent mission ID', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/missions/MSN-9999-9999')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Mission not found');
    });
});
