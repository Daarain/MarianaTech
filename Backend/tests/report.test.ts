import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { Mission } from '../src/models/mission.model';
import { AnomalyModel } from '../src/models/anomaly.model';
import { ReportModel } from '../src/models/report.model';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('STEP 13: Report Generation Subsystem Tests', () => {
  let testMissionId: string;
  let createdReportUrl: string;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await Mission.deleteMany({});
    await AnomalyModel.deleteMany({});
    await ReportModel.deleteMany({});

    authToken = jwt.sign(
      { id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const mission = await Mission.create({
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

    await AnomalyModel.create({
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
    await disconnectDatabase();
  });

  it('POST /missions/:missionId/reports should generate CSV report and return exact { url } shape', async () => {
    const res = await request(app)
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
    const res = await request(app)
      .get(`/missions/${testMissionId}/reports/download?format=json`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(res.body.url).toMatch(/^\/reports\/file\/RPT-/);
  });

  it('GET /reports/file/:reportId should stream generated report file to client', async () => {
    const res = await request(app).get(createdReportUrl);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('# MarianaTech Side-scan Sonar Mission Intelligence Report');
    expect(res.text).toContain(testMissionId);
    expect(res.text).toContain('ANM-RPT-001');
  });
});
