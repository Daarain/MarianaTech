import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { Mission } from '../src/models/mission.model';
import { MissionFileModel } from '../src/models/missionFile.model';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Mission File Management API Tests', () => {
  let testMissionId: string;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await Mission.deleteMany({});
    await MissionFileModel.deleteMany({});

    authToken = jwt.sign(
      { id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const mission = await Mission.create({
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
    await disconnectDatabase();
  });

  it('POST /missions/:missionId/files should reject unsupported file extensions', async () => {
    const badBuffer = Buffer.from('FAKE_EXE_CONTENT');
    const res = await request(app)
      .post(`/missions/${testMissionId}/files`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', badBuffer, 'malware.exe');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Unsupported file extension');
  });

  it('POST /missions/:missionId/files should accept valid sonar files (.xtf) and return metadata', async () => {
    const fakeSonarContent = Buffer.from('RAW_SONAR_SIDE_SCAN_BINARY_STREAM_HEADER_0x88');
    const res = await request(app)
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
    const res = await request(app)
      .get(`/missions/${testMissionId}/files`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('missionId', testMissionId);
  });
});
