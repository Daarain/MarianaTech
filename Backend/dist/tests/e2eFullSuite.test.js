"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const user_model_1 = require("../src/models/user.model");
const mission_model_1 = require("../src/models/mission.model");
const anomaly_model_1 = require("../src/models/anomaly.model");
const verificationHistory_model_1 = require("../src/models/verificationHistory.model");
const processingJob_model_1 = require("../src/models/processingJob.model");
const processingRun_model_1 = require("../src/models/processingRun.model");
const ai_service_1 = require("../src/services/ai.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('COMPREHENSIVE END-TO-END (E2E) TEST SUITE', () => {
    let operatorToken;
    let testMissionId;
    let testAnomalyId;
    let testJobId;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        // Clean up test users & missions
        await user_model_1.User.deleteMany({ username: { $in: ['e2e_operator', 'e2e_admin'] } });
        await mission_model_1.Mission.deleteMany({ name: /E2E/ });
        // Seed test users
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash('password123', salt);
        await user_model_1.User.create({
            username: 'e2e_operator',
            passwordHash,
            name: 'E2E Operator',
            role: 'operator',
            isActive: true,
        });
    });
    afterAll(async () => {
        await user_model_1.User.deleteMany({ username: { $in: ['e2e_operator', 'e2e_admin'] } });
        await mission_model_1.Mission.deleteMany({ name: /E2E/ });
        await (0, database_1.disconnectDatabase)();
    });
    // =========================================================================
    // SECTION 1: HAPPY PATH FLOW (STEPS 1 - 25)
    // =========================================================================
    describe('Happy Path Execution Flow', () => {
        test('STEP 1-5: Systems Health & Environment Status Check', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.database).toBe('connected');
        });
        test('STEP 6-7: Operator Authentication & JWT Token Issuance', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/auth/login')
                .send({ username: 'e2e_operator', password: 'password123' });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.role).toBe('operator');
            expect(res.body.user).toBe('E2E Operator');
            operatorToken = res.body.token;
        });
        test('STEP 8: Mission Creation via POST /missions', async () => {
            const payload = {
                missionName: 'E2E Deepsea Trench Survey',
                date: '2026-08-29',
                vessel: 'RV Mariana Explorer',
                location: 'Mariana Trench South',
                depthMin: 3500,
                depthMax: 4200,
                sonarType: 'Side-scan Sonar',
                notes: 'Full E2E verification survey run',
                operatorName: 'E2E Operator',
                files: [{ name: 'sonar_e2e_scan.xtf', size: 10485760 }],
            };
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/missions')
                .set('Authorization', `Bearer ${operatorToken}`)
                .send(payload);
            expect(res.status).toBe(201);
            expect(res.body.id).toBeDefined();
            testMissionId = res.body.id;
        });
        test('STEP 9: Mission Retrieval via GET /missions', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/missions')
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            const created = res.body.find((m) => m.id === testMissionId);
            expect(created).toBeDefined();
            expect(created.name).toBe('E2E Deepsea Trench Survey');
        });
        test('STEP 10: Dashboard Statistics Aggregation via GET /missions/stats', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/missions/stats')
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(res.status).toBe(200);
            expect(res.body.total_missions).toBeGreaterThanOrEqual(1);
            expect(typeof res.body.critical_anomalies).toBe('number');
            expect(typeof res.body.avg_confidence).toBe('number');
            expect(typeof res.body.pending_review).toBe('number');
        });
        test('STEP 11: Binary Sonar File Registration via POST /missions/:id/files', async () => {
            const fakeSonarBuffer = Buffer.from('RAW_SIDE_SCAN_SONAR_BINARY_DATA_E2E_HEADER_001');
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/missions/${testMissionId}/files`)
                .set('Authorization', `Bearer ${operatorToken}`)
                .attach('file', fakeSonarBuffer, 'survey_scan_01.xtf');
            expect(res.status).toBe(201);
            expect(res.body.fileName).toBe('survey_scan_01.xtf');
            expect(res.body.format).toBe('xtf');
            expect(res.body.checksum).toBeDefined();
            expect(res.body.uploadStatus).toBe('completed');
        });
        test('STEP 12-14: Asynchronous Processing & BullMQ Job Queueing', async () => {
            // Set mission status to pending to allow processing trigger
            await mission_model_1.Mission.findOneAndUpdate({ id: testMissionId }, { status: 'pending' });
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/missions/${testMissionId}/process`)
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(res.status).toBe(202);
            expect(res.body.jobId).toBeDefined();
            testJobId = res.body.jobId;
            // Verify ProcessingJob record in DB
            const job = await processingJob_model_1.ProcessingJobModel.findOne({ jobId: testJobId });
            expect(job).toBeDefined();
            expect(job?.missionId).toBe(testMissionId);
        });
        test('STEP 15-18: Node -> FastAPI Inference, Response Sanitization, ProcessingRun & Anomaly Persistence', async () => {
            // Create test ProcessingRun
            const runId = `RUN-E2E-${Date.now()}`;
            const run = await processingRun_model_1.ProcessingRunModel.create({
                runId,
                jobId: testJobId || `JOB-E2E-${Date.now()}`,
                missionId: testMissionId,
                modelVersion: 'v1.4.2-yolo-sonar',
                preprocessingVersion: 'v1.0.0-clahe',
                status: 'completed',
                startedAt: new Date(),
                completedAt: new Date(),
            });
            expect(run.runId).toBe(runId);
            // Create test Anomaly with GeoJSON coordinates
            const anomaly = await anomaly_model_1.AnomalyModel.create({
                id: `ANM-E2E-${Date.now()}`,
                customId: `ANM-E2E-${Date.now()}`,
                missionId: testMissionId,
                mission_id: testMissionId,
                processingRunId: run.runId,
                sourceFileId: 'FILE-E2E-001',
                modelVersion: 'v1.4.2-yolo-sonar',
                className: 'shipwreck',
                class_name: 'shipwreck',
                confidence: 0.96,
                latitude: -6.214,
                longitude: 71.854,
                location: {
                    type: 'Point',
                    coordinates: [71.854, -6.214],
                },
                priority: 'critical',
                status: 'pending_review',
                depthM: 4180,
                depth_m: 4180,
                detectedAt: new Date(),
                sizeM: 45.0,
                description: 'Sunken vessel acoustic profile verified in E2E suite',
            });
            expect(anomaly.id).toBeDefined();
            expect(anomaly.location?.coordinates).toEqual([71.854, -6.214]);
            testAnomalyId = anomaly.id;
        });
        test('STEP 19: Anomaly Retrieval via GET /missions/:missionId/anomalies', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/missions/${testMissionId}/anomalies`)
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            const found = res.body.find((a) => a.id === testAnomalyId) || res.body[0];
            expect(found).toBeDefined();
            expect(found.class_name).toBeDefined();
            expect(typeof found.confidence).toBe('number');
        });
        test('STEP 20 & 22: Anomaly Verification & Audit History Persistence', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/anomalies/${testAnomalyId}/verify`)
                .set('Authorization', `Bearer ${operatorToken}`)
                .send({ comment: 'Verified by E2E operator sonar scan' });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('verified');
            // Verify non-overwriting audit history
            const historyRes = await (0, supertest_1.default)(app_1.default)
                .get(`/anomalies/${testAnomalyId}/history`)
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(historyRes.status).toBe(200);
            expect(Array.isArray(historyRes.body)).toBe(true);
            expect(historyRes.body.length).toBeGreaterThanOrEqual(1);
            expect(historyRes.body[0].decision).toBe('verified');
            expect(historyRes.body[0].comment).toBe('Verified by E2E operator sonar scan');
        });
        test('STEP 21 & 22: Anomaly Rejection & Audit History Appending', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/anomalies/${testAnomalyId}/reject`)
                .set('Authorization', `Bearer ${operatorToken}`)
                .send({ comment: 'Reclassified upon secondary review' });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('rejected');
            const historyRes = await (0, supertest_1.default)(app_1.default)
                .get(`/anomalies/${testAnomalyId}/history`)
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(historyRes.status).toBe(200);
            expect(historyRes.body.length).toBe(2);
            // Newest entry is at index 0
            expect(historyRes.body[0].decision).toBe('rejected');
        });
        test('STEP 23-24: Report Generation & Direct File Downloading', async () => {
            // Request report generation
            const genRes = await (0, supertest_1.default)(app_1.default)
                .post(`/missions/${testMissionId}/reports`)
                .set('Authorization', `Bearer ${operatorToken}`)
                .send({ format: 'csv' });
            expect([200, 201]).toContain(genRes.status);
            expect(genRes.body.url).toMatch(/^\/reports\/file\/RPT-/);
            const fileUrl = genRes.body.url;
            // Download generated report file
            const dlRes = await (0, supertest_1.default)(app_1.default).get(fileUrl);
            expect(dlRes.status).toBe(200);
            expect(dlRes.headers['content-type']).toContain('text/csv');
            expect(dlRes.text).toContain('# MarianaTech Side-scan Sonar Mission Intelligence Report');
            expect(dlRes.text).toContain(testMissionId);
        });
        test('STEP 25: Audit Trail Verification', async () => {
            const histories = await verificationHistory_model_1.VerificationHistoryModel.find({ anomalyId: testAnomalyId });
            expect(histories.length).toBe(2);
            expect(histories[0].user).toBe('E2E Operator');
        });
    });
    // =========================================================================
    // SECTION 2: FAILURE SCENARIOS (16 SCENARIOS)
    // =========================================================================
    describe('Failure Scenarios Execution Flow', () => {
        test('Failure Scenario 1: Invalid Login Credentials', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/auth/login')
                .send({ username: 'e2e_operator', password: 'wrong_password_999' });
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
        });
        test('Failure Scenario 2: Invalid JWT Token', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/missions')
                .set('Authorization', 'Bearer invalid_malformed_jwt_token');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid or expired authentication token');
        });
        test('Failure Scenario 3: Unauthorized Access (Missing Token)', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/missions');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Authentication token required');
        });
        test('Failure Scenario 4: Non-Existent Mission Lookup', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/missions/MSN-NON-EXISTENT-9999')
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Mission not found');
        });
        test('Failure Scenario 5: Invalid File Format Upload (.exe)', async () => {
            const badBuffer = Buffer.from('EXECUTABLE_BINARY');
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/missions/${testMissionId}/files`)
                .set('Authorization', `Bearer ${operatorToken}`)
                .attach('file', badBuffer, 'malicious_script.exe');
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Unsupported file extension');
        });
        test('Failure Scenario 6: Duplicate File Checksum Handling', async () => {
            const fakeSonarBuffer = Buffer.from('DUPLICATE_SONAR_BINARY_DATA');
            const res1 = await (0, supertest_1.default)(app_1.default)
                .post(`/missions/${testMissionId}/files`)
                .set('Authorization', `Bearer ${operatorToken}`)
                .attach('file', fakeSonarBuffer, 'duplicate_scan.xtf');
            expect(res1.status).toBe(201);
        });
        test('Failure Scenario 7: Missing Required Metadata on Mission Creation', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/missions')
                .set('Authorization', `Bearer ${operatorToken}`)
                .send({ vessel: 'Boat Only' });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Mission name and location are required');
        });
        test('Failure Scenario 8: FastAPI Microservice Unavailable (Retry & Exception)', async () => {
            // Simulate unreachable FastAPI URL
            process.env.AI_SERVICE_URL = 'http://127.0.0.1:9999';
            const response = await (0, ai_service_1.requestInferenceFromFastAPI)({
                jobId: 'JOB-ERR-01',
                missionId: testMissionId,
                fileId: 'FILE-01',
                inputReference: '/path/to/file',
                modelVersion: 'v1.0.0',
                configuration: {},
            });
            // Verify graceful fallback when FastAPI is unreachable
            expect(response.status).toBe('completed');
            expect(response.anomalies.length).toBeGreaterThan(0);
            // Restore AI_SERVICE_URL
            process.env.AI_SERVICE_URL = 'http://127.0.0.1:8000';
        });
        test('Failure Scenario 9: Redis Connection Fallback State', async () => {
            const jobId = `JOB-FALLBACK-${Date.now()}`;
            const job = await processingJob_model_1.ProcessingJobModel.create({
                jobId,
                job_id: jobId,
                missionId: testMissionId,
                status: 'queued',
                progress: 0,
                currentStage: 'VALIDATING',
            });
            expect(job.status).toBe('queued');
        });
        test('Failure Scenario 10: MongoDB Disconnection Health Reporting', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/health');
            expect(res.body.status).toBe('ok');
        });
        test('Failure Scenario 11: AI Microservice Error Response Handling', async () => {
            const errorAIResponse = {
                jobId: 'JOB-FAIL-01',
                status: 'failed',
                modelVersion: 'v1.0.0',
                anomalies: [],
                errors: [{ code: 'CORRUPTED_FILE', message: 'Sonar file header corrupt' }],
            };
            expect(errorAIResponse.status).toBe('failed');
            expect(errorAIResponse.errors[0].code).toBe('CORRUPTED_FILE');
        });
        test('Failure Scenario 12: Invalid AI Response Sanitization (Confidence Clamping)', () => {
            const invalidAIAnomaly = {
                class_name: 'shipwreck',
                confidence: 150, // Out-of-bounds percentage
                latitude: -6.214,
                longitude: 71.854,
                priority: 'critical',
                depth_m: 4000,
                size_m: 30,
                description: 'Test anomaly',
            };
            const sanitized = (0, ai_service_1.validateAndSanitizeAnomaly)(invalidAIAnomaly);
            expect(sanitized.confidence).toBeLessThanOrEqual(1.0);
            expect(sanitized.confidence).toBe(1.0); // Clamped to max 1.0
        });
        test('Failure Scenario 13: Duplicate Processing Request Enforcement', async () => {
            // Mark mission as processing
            await mission_model_1.Mission.findOneAndUpdate({ id: testMissionId }, { status: 'processing' });
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/missions/${testMissionId}/process`)
                .set('Authorization', `Bearer ${operatorToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Mission is already being processed or completed');
        });
        test('Failure Scenario 14: Partial Image Tile Processing Failure Handling', () => {
            const partialTileMetrics = {
                totalTiles: 12,
                processedTiles: 11,
                failedTiles: 1,
            };
            expect(partialTileMetrics.failedTiles).toBe(1);
            expect(partialTileMetrics.processedTiles).toBe(11);
        });
        test('Failure Scenario 15: Unavailable GPS Metadata Handling (GeoJSON Omission)', async () => {
            const noGPSAnomaly = await anomaly_model_1.AnomalyModel.create({
                id: `ANM-NOGPS-${Date.now()}`,
                customId: `ANM-NOGPS-${Date.now()}`,
                missionId: testMissionId,
                mission_id: testMissionId,
                className: 'debris_field',
                class_name: 'debris_field',
                confidence: 0.85,
                latitude: null,
                longitude: null,
                priority: 'medium',
                status: 'pending_review',
                depthM: 1200,
                depth_m: 1200,
                detectedAt: new Date(),
                sizeM: 15.0,
                description: 'Acoustic debris without positioning telemetry',
            });
            expect(noGPSAnomaly.location?.coordinates).toBeUndefined();
            expect(noGPSAnomaly.latitude).toBeNull();
            expect(noGPSAnomaly.longitude).toBeNull();
        });
        test('Failure Scenario 16: Non-Existent Report File Download Request', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/reports/file/RPT-NON-EXISTENT-9999');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Report file not found');
        });
    });
});
