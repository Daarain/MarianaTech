"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const mission_model_1 = require("../src/models/mission.model");
const anomaly_model_1 = require("../src/models/anomaly.model");
const report_model_1 = require("../src/models/report.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('STEP 13: Report Generation Subsystem Tests', () => {
    let testMissionId;
    let createdReportUrl;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        await anomaly_model_1.AnomalyModel.deleteMany({});
        await report_model_1.ReportModel.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        const mission = await mission_model_1.Mission.create({
            id: 'MSN-2026-RPT1',
            customId: 'MSN-2026-RPT1',
            name: 'Pacific Trench Report Mission',
            date: '2026-08-29',
            location: 'Pacific Ocean',
            status: 'complete',
            anomalyCount: 2,
            priority: 'high',
            depthM: 3800,
            areaKm2: 30,
            operator: 'Cdr. A. Fernando',
            sonarType: 'Side-scan Sonar',
        });
        testMissionId = mission.id;
        await anomaly_model_1.AnomalyModel.create({
            id: 'ANM-RPT-001',
            customId: 'ANM-RPT-001',
            missionId: testMissionId,
            className: 'shipwreck',
            confidence: 0.95,
            latitude: -6.214,
            longitude: 71.854,
            location: {
                type: 'Point',
                coordinates: [71.854, -6.214],
            },
            priority: 'critical',
            status: 'verified',
            depthM: 3780,
            sizeM: 50.0,
            description: 'Historical vessel hull',
        });
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('POST /missions/:missionId/reports should generate CSV report and return exact { url } shape', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/missions/${testMissionId}/reports`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ format: 'csv' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('url');
        expect(typeof res.body.url).toBe('string');
        expect(res.body.url).toMatch(/^\/reports\/file\/RPT-/);
        createdReportUrl = res.body.url;
    });
    it('GET /missions/:missionId/reports/download should return download URL matching exact { url } shape', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/missions/${testMissionId}/reports/download?format=json`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('url');
        expect(res.body.url).toMatch(/^\/reports\/file\/RPT-/);
    });
    it('GET /reports/file/:reportId should stream generated report file to client', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get(createdReportUrl);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        expect(res.text).toContain('# MarianaTech Side-scan Sonar Mission Intelligence Report');
        expect(res.text).toContain(testMissionId);
        expect(res.text).toContain('ANM-RPT-001');
    });
});
