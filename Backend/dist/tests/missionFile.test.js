"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const mission_model_1 = require("../src/models/mission.model");
const missionFile_model_1 = require("../src/models/missionFile.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('Mission File Management API Tests', () => {
    let testMissionId;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        await missionFile_model_1.MissionFileModel.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        const mission = await mission_model_1.Mission.create({
            id: 'MSN-2026-0099',
            customId: 'MSN-2026-0099',
            name: 'Baltic Pipeline Inspection',
            date: '2026-08-29',
            location: 'Baltic Sea',
            status: 'pending',
            anomalyCount: 0,
            priority: 'medium',
            depthMin: 40,
            depthMax: 80,
            depthM: 60,
            areaKm2: 25,
            operator: 'Lt. R. Mehta',
            sonarType: 'Side-scan Sonar',
        });
        testMissionId = mission.id;
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('POST /missions/:missionId/files should reject unsupported file extensions', async () => {
        const badBuffer = Buffer.from('FAKE_EXE_CONTENT');
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/missions/${testMissionId}/files`)
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', badBuffer, 'malware.exe');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toContain('Unsupported file extension');
    });
    it('POST /missions/:missionId/files should accept valid sonar files (.xtf) and return metadata', async () => {
        const fakeSonarContent = Buffer.from('RAW_SONAR_SIDE_SCAN_BINARY_STREAM_HEADER_0x88');
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/missions/${testMissionId}/files`)
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', fakeSonarContent, 'baltic_scan_01.xtf');
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('missionId', testMissionId);
        expect(res.body).toHaveProperty('fileName', 'baltic_scan_01.xtf');
        expect(res.body).toHaveProperty('format', 'xtf');
        expect(res.body).toHaveProperty('checksum');
        expect(res.body).toHaveProperty('uploadStatus', 'completed');
        expect(res.body).toHaveProperty('validationStatus', 'valid');
    });
    it('GET /missions/:missionId/files should list uploaded file metadata entries', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/missions/${testMissionId}/files`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('missionId', testMissionId);
    });
});
