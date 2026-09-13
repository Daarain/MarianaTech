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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../src/config/env");
describe('STEP 12: MongoDB Geospatial Support Subsystem', () => {
    let missionId;
    let authToken;
    beforeAll(async () => {
        await (0, database_1.connectDatabase)();
        await mission_model_1.Mission.deleteMany({});
        await anomaly_model_1.AnomalyModel.deleteMany({});
        authToken = jsonwebtoken_1.default.sign({ id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' }, env_1.config.jwtSecret, { expiresIn: '1h' });
        const mission = await mission_model_1.Mission.create({
            id: `MSN-2026-GEO-${Date.now()}`,
            customId: `MSN-2026-GEO-${Date.now()}`,
            name: 'Chagos Trench Spatial Survey',
            date: '2026-08-29',
            location: 'Chagos Trench',
            status: 'complete',
            anomalyCount: 3,
            priority: 'high',
            depthM: 4200,
            areaKm2: 50,
            operator: 'Lt. R. Mehta',
            sonarType: 'Side-scan Sonar',
        });
        missionId = mission.id;
        // Anomaly 1: Near reference point [-6.214, 71.854] -> GeoJSON [71.854, -6.214]
        await anomaly_model_1.AnomalyModel.create({
            id: 'ANM-GEO-001',
            customId: 'ANM-GEO-001',
            missionId,
            className: 'shipwreck',
            confidence: 0.94,
            latitude: -6.214,
            longitude: 71.854,
            location: {
                type: 'Point',
                coordinates: [71.854, -6.214],
            },
            priority: 'critical',
            status: 'pending_review',
            depthM: 4180,
            sizeM: 42.5,
            description: 'Sunken vessel near Chagos trench',
        });
        // Anomaly 2: ~2km away -> [-6.220, 71.860] -> GeoJSON [71.860, -6.220]
        await anomaly_model_1.AnomalyModel.create({
            id: 'ANM-GEO-002',
            customId: 'ANM-GEO-002',
            missionId,
            className: 'pipeline_damage',
            confidence: 0.88,
            latitude: -6.22,
            longitude: 71.86,
            location: {
                type: 'Point',
                coordinates: [71.86, -6.22],
            },
            priority: 'high',
            status: 'pending_review',
            depthM: 4210,
            sizeM: 12.0,
            description: 'Conduit structural rupture',
        });
        // Anomaly 3: No GPS telemetry (latitude & longitude null) -> location omitted
        await anomaly_model_1.AnomalyModel.create({
            id: 'ANM-GEO-003',
            customId: 'ANM-GEO-003',
            missionId,
            className: 'debris_field',
            confidence: 0.75,
            latitude: null,
            longitude: null,
            priority: 'medium',
            status: 'pending_review',
            depthM: 4150,
            sizeM: 5.0,
            description: 'Debris field without GPS signal',
        });
        // Ensure 2dsphere index is built
        await anomaly_model_1.AnomalyModel.syncIndexes();
    });
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('GeoJSON Point stores [longitude, latitude] order in MongoDB', async () => {
        const anomaly = await anomaly_model_1.AnomalyModel.findOne({ id: 'ANM-GEO-001' });
        expect(anomaly).toBeDefined();
        expect(anomaly?.location).toBeDefined();
        expect(anomaly?.location?.type).toBe('Point');
        expect(anomaly?.location?.coordinates).toEqual([71.854, -6.214]);
    });
    it('toJSON output preserves latitude and longitude for frontend compatibility', async () => {
        const anomaly = await anomaly_model_1.AnomalyModel.findOne({ id: 'ANM-GEO-001' });
        const json = anomaly?.toJSON();
        expect(json).toHaveProperty('latitude', -6.214);
        expect(json).toHaveProperty('longitude', 71.854);
        expect(json).toHaveProperty('id', 'ANM-GEO-001');
    });
    it('GET /anomalies/near returns anomalies ordered by proximity using $near', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/anomalies/near?lng=71.854&lat=-6.214&maxDistance=10000')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].id).toBe('ANM-GEO-001');
    });
    it('GET /anomalies/within returns anomalies within specified radius using $centerSphere', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/anomalies/within?lng=71.860&lat=-6.220&radiusKm=20')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2); // ANM-GEO-001 and ANM-GEO-002
    });
    it('GET /missions/:missionId/anomalies/spatial returns mission anomalies with GeoJSON spatial data', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/missions/${missionId}/anomalies/spatial`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2); // Only anomalies with valid location
    });
});
