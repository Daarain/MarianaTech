"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const mission_model_1 = require("../src/models/mission.model");
const processingJob_model_1 = require("../src/models/processingJob.model");
const processingRun_model_1 = require("../src/models/processingRun.model");
const anomaly_model_1 = require("../src/models/anomaly.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('STEP 11: AI Result Persistence Subsystem Tests', () => {
    let testMissionId;
    let testJobId;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        await processingJob_model_1.ProcessingJobModel.deleteMany({});
        await processingRun_model_1.ProcessingRunModel.deleteMany({});
        await anomaly_model_1.AnomalyModel.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        // Seed test mission
        const mission = await mission_model_1.Mission.create({
            id: 'MSN-2026-0888',
            customId: 'MSN-2026-0888',
            name: 'Deep Trench Persistence Run',
            date: '2026-08-29',
            location: 'Mariana Deep',
            status: 'pending',
            anomalyCount: 0,
            priority: 'low',
            depthMin: 4000,
            depthMax: 5000,
            depthM: 4500,
            areaKm2: 50,
            operator: 'Cdr. A. Fernando',
            sonarType: 'Side-scan Sonar',
        });
        testMissionId = mission.id;
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('POST /missions/:missionId/process should create ProcessingJob, ProcessingRun, and save sanitized AI Anomalies in MongoDB', async () => {
        const processRes = await (0, supertest_1.default)(app_1.default)
            .post(`/missions/${testMissionId}/process`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(processRes.status).toBe(202);
        expect(processRes.body).toHaveProperty('jobId');
        testJobId = processRes.body.jobId;
        // Verify ProcessingRun document was saved
        const run = await processingRun_model_1.ProcessingRunModel.findOne({ missionId: testMissionId });
        expect(run).toBeDefined();
        expect(run?.status).toBe('completed');
        expect(run?.modelVersion).toBeDefined();
        // Verify Anomalies were saved with model references
        const anomalies = await anomaly_model_1.AnomalyModel.find({ missionId: testMissionId });
        expect(anomalies.length).toBeGreaterThan(0);
        expect(anomalies[0].processingRunId).toBe(run?.runId);
        expect(anomalies[0].modelVersion).toBeDefined();
        // Verify mission status and anomaly count were updated
        const updatedMission = await mission_model_1.Mission.findOne({ id: testMissionId });
        expect(updatedMission?.status).toBe('complete');
        expect(updatedMission?.anomalyCount).toBe(anomalies.length);
    });
    it('GET /missions/:missionId/anomalies should return persisted anomalies with processing run reference metadata', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/missions/${testMissionId}/anomalies`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        const a = res.body[0];
        expect(a).toHaveProperty('id');
        expect(a).toHaveProperty('class_name');
        expect(a).toHaveProperty('confidence');
        expect(a.confidence).toBeGreaterThanOrEqual(0);
        expect(a.confidence).toBeLessThanOrEqual(1);
    });
});
