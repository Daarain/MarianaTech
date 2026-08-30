import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { Mission } from '../src/models/mission.model';
import { AnomalyModel } from '../src/models/anomaly.model';
import { VerificationHistoryModel } from '../src/models/verificationHistory.model';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Anomaly Management API Tests', () => {
  let testMissionId: string;
  let testAnomalyId: string;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await Mission.deleteMany({});
    await AnomalyModel.deleteMany({});
    await VerificationHistoryModel.deleteMany({});

    authToken = jwt.sign(
      { id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create test mission
    const mission = await Mission.create({
      id: 'MSN-2026-0150',
      customId: 'MSN-2026-0150',
      name: 'South China Sea Recon',
      date: '2026-08-29',
      location: 'South China Sea',
      status: 'complete',
      anomalyCount: 1,
      priority: 'critical',
      depthMin: 2000,
      depthMax: 3000,
      depthM: 2500,
      areaKm2: 20,
      operator: 'Cdr. A. Fernando',
      sonarType: 'Synthetic Aperture Sonar',
    });

    testMissionId = mission.id;

    // Create test anomaly
    const anomaly = await AnomalyModel.create({
      id: 'ANM-2026-0099',
      customId: 'ANM-2026-0099',
      missionId: testMissionId,
      className: 'mine_like_contact',
      confidence: 0.96,
      latitude: 14.5995,
      longitude: 120.9842,
      priority: 'critical',
      status: 'pending_review',
      depthM: 2450,
      detectedAt: new Date('2026-08-29T12:00:00Z'),
      sizeM: 2.8,
      description: 'Naval ordnance mine contact profile',
      isDemoData: true,
    });

    testAnomalyId = anomaly.id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /missions/:missionId/anomalies should return anomalies in exact frontend format', async () => {
    const res = await request(app)
      .get(`/missions/${testMissionId}/anomalies`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const a = res.body[0];
    expect(a).toHaveProperty('id', 'ANM-2026-0099');
    expect(a).toHaveProperty('mission_id', testMissionId);
    expect(a).toHaveProperty('class_name', 'mine_like_contact');
    expect(a).toHaveProperty('confidence', 0.96);
    expect(a).toHaveProperty('latitude', 14.5995);
    expect(a).toHaveProperty('longitude', 120.9842);
    expect(a).toHaveProperty('priority', 'critical');
    expect(a).toHaveProperty('status', 'pending_review');
    expect(a).toHaveProperty('depth_m', 2450);
    expect(a).toHaveProperty('detected_at');
    expect(a).toHaveProperty('size_m', 2.8);
    expect(a).toHaveProperty('description', 'Naval ordnance mine contact profile');
  });

  it('GET /anomalies/:anomalyId should return single anomaly details', async () => {
    const res = await request(app)
      .get(`/anomalies/${testAnomalyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', testAnomalyId);
    expect(res.body).toHaveProperty('class_name', 'mine_like_contact');
  });

  it('POST /anomalies/:anomalyId/verify should update status to verified and record history', async () => {
    const verifyRes = await request(app)
      .post(`/anomalies/${testAnomalyId}/verify`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ comment: 'Confirmed mine contact during acoustic review.' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toHaveProperty('id', testAnomalyId);
    expect(verifyRes.body).toHaveProperty('status', 'verified');

    // Check history endpoint
    const historyRes = await request(app)
      .get(`/anomalies/${testAnomalyId}/history`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body)).toBe(true);
    expect(historyRes.body.length).toBe(1);
    expect(historyRes.body[0]).toHaveProperty('decision', 'verified');
    expect(historyRes.body[0]).toHaveProperty('comment', 'Confirmed mine contact during acoustic review.');
  });

  it('POST /anomalies/:anomalyId/reject should update status to rejected and add history without overwriting', async () => {
    const rejectRes = await request(app)
      .post(`/anomalies/${testAnomalyId}/reject`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ comment: 'Re-evaluated as natural rock formation.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body).toHaveProperty('status', 'rejected');

    // Check history has accumulated both entries
    const historyRes = await request(app)
      .get(`/anomalies/${testAnomalyId}/history`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.length).toBe(2);
    expect(historyRes.body[0]).toHaveProperty('decision', 'rejected');
  });
});
