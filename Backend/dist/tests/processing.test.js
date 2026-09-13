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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('STEP 8: Asynchronous Processing Subsystem Tests', () => {
    let testMissionId;
    let createdJobId;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        await processingJob_model_1.ProcessingJobModel.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        const mission = await mission_model_1.Mission.create({
            id: 'MSN-2026-0777',
            customId: 'MSN-2026-0777',
            name: 'Async Pipeline Survey Run',
            date: '2026-08-29',
            location: 'Marianas Trench',
            status: 'pending',
            anomalyCount: 0,
            priority: 'high',
            depthMin: 3000,
            depthMax: 4000,
            depthM: 3500,
            areaKm2: 40,
            operator: 'Lt. R. Mehta',
            sonarType: 'Side-scan Sonar',
        });
        testMissionId = mission.id;
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('POST /missions/:missionId/process should create a ProcessingJob in MongoDB and return 202 Accepted immediately', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/missions/${testMissionId}/process`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(202);
        expect(res.body).toHaveProperty('jobId');
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('currentStage');
        createdJobId = res.body.jobId;
    });
    it('GET /jobs/:jobId should retrieve the status, progress, and stage of a processing job', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/jobs/${createdJobId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('jobId', createdJobId);
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('currentStage');
        expect(res.body).toHaveProperty('progress');
    });
    it('POST /jobs/:jobId/retry should re-queue a job and reset its execution state', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/jobs/${createdJobId}/retry`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('jobId', createdJobId);
        expect(res.body).toHaveProperty('status');
    });
});
