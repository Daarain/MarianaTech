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
const processingJob_model_1 = require("../src/models/processingJob.model");
const ai_service_1 = require("../src/services/ai.service");
const sonarQueue_1 = require("../src/queue/sonarQueue");
const sonarWorker_1 = require("../src/workers/sonarWorker");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('Node.js to FastAPI AI Integration Tests', () => {
    let createdMissionId;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        await anomaly_model_1.AnomalyModel.deleteMany({});
        await processingJob_model_1.ProcessingJobModel.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        const mission = await mission_model_1.Mission.create({
            id: 'MSN-2026-0999',
            customId: 'MSN-2026-0999',
            name: 'AI Pipeline Integration Test Mission',
            date: '2026-08-29',
            location: 'Whitley Deep',
            status: 'pending',
            operator: 'Cdr. A. Fernando',
            sonarType: 'Synthetic Aperture Sonar',
            depthM: 4500,
        });
        createdMissionId = mission.id;
    });
    afterAll(async () => {
        await (0, sonarWorker_1.closeSonarWorker)();
        await (0, sonarQueue_1.closeRedisQueue)();
        await (0, database_1.disconnectDatabase)();
    });
    it('validateFastAPIResponse should correctly validate FastAPI response schema', () => {
        const validPayload = {
            jobId: 'JOB-2026-0001',
            status: 'completed',
            modelVersion: 'YOLOv8-sonar-v1.2',
            quality: { snrDb: 22.0 },
            anomalies: [
                {
                    className: 'mine_like_contact',
                    confidence: 0.95,
                    latitude: -6.214,
                    longitude: 71.854,
                },
            ],
            processing: { inferenceTimeMs: 120 },
            errors: [],
        };
        expect((0, ai_service_1.validateFastAPIResponse)(validPayload)).toBe(true);
        expect(() => (0, ai_service_1.validateFastAPIResponse)(null)).toThrow('Response is not an object');
        expect(() => (0, ai_service_1.validateFastAPIResponse)({ status: 'completed' })).toThrow('Missing or invalid jobId');
        expect(() => (0, ai_service_1.validateFastAPIResponse)({ jobId: 'J1', status: 'completed', anomalies: 'not-an-array' })).toThrow('anomalies field must be an array');
    });
    it('generateMockAIResponse should return response matching exact FastAPI schema', () => {
        const req = {
            jobId: 'JOB-2026-0001',
            missionId: 'MSN-2026-0999',
            inputReference: 'sonar_scan_ref',
        };
        const res = (0, ai_service_1.generateMockAIResponse)(req);
        expect(res).toHaveProperty('jobId', req.jobId);
        expect(res).toHaveProperty('status', 'completed');
        expect(res).toHaveProperty('modelVersion');
        expect(res).toHaveProperty('quality');
        expect(Array.isArray(res.anomalies)).toBe(true);
        expect(res.anomalies.length).toBeGreaterThan(0);
    });
    it('requestInferenceFromFastAPI should send HTTP inference request, handle retries & return validated response', async () => {
        const reqPayload = {
            jobId: 'JOB-2026-0002',
            missionId: createdMissionId,
            inputReference: 'chagos_sonar_data_01',
            modelVersion: 'v1.0.0',
            configuration: { threshold: 0.8 },
        };
        const res = await (0, ai_service_1.requestInferenceFromFastAPI)(reqPayload, 2, 1000);
        expect(res).toHaveProperty('jobId', 'JOB-2026-0002');
        expect(res).toHaveProperty('status', 'completed');
        expect(Array.isArray(res.anomalies)).toBe(true);
    });
    it('triggering mission processing should invoke AI service pipeline and populate anomalies in MongoDB', async () => {
        const processRes = await (0, supertest_1.default)(app_1.default)
            .post(`/missions/${createdMissionId}/process`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(processRes.status).toBe(202);
        const anomaliesRes = await (0, supertest_1.default)(app_1.default)
            .get(`/missions/${createdMissionId}/anomalies`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(anomaliesRes.status).toBe(200);
        expect(Array.isArray(anomaliesRes.body)).toBe(true);
        expect(anomaliesRes.body.length).toBeGreaterThan(0);
        const a = anomaliesRes.body[0];
        expect(a).toHaveProperty('mission_id', createdMissionId);
        expect(a).toHaveProperty('class_name');
        expect(a).toHaveProperty('confidence');
    });
});
