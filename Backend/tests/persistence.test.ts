import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { Mission } from '../src/models/mission.model';
import { ProcessingJobModel } from '../src/models/processingJob.model';
import { ProcessingRunModel } from '../src/models/processingRun.model';
import { AnomalyModel } from '../src/models/anomaly.model';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('STEP 11: AI Result Persistence Subsystem Tests', () => {
  let testMissionId: string;
  let testJobId: string;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await Mission.deleteMany({});
    await ProcessingJobModel.deleteMany({});
    await ProcessingRunModel.deleteMany({});
    await AnomalyModel.deleteMany({});

    authToken = jwt.sign(
      { id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Seed test mission
    const mission = await Mission.create({
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
    await disconnectDatabase();
  });

  it('POST /missions/:missionId/process should create ProcessingJob, ProcessingRun, and save sanitized AI Anomalies in MongoDB', async () => {
    const processRes = await request(app)
      .post(`/missions/${testMissionId}/process`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(processRes.status).toBe(202);
    expect(processRes.body).toHaveProperty('jobId');
    testJobId = processRes.body.jobId;

    // Verify ProcessingRun document was saved
    const run = await ProcessingRunModel.findOne({ missionId: testMissionId });
    expect(run).toBeDefined();
    expect(run?.status).toBe('completed');
    expect(run?.modelVersion).toBeDefined();

    // Verify Anomalies were saved with model references
    const anomalies = await AnomalyModel.find({ missionId: testMissionId });
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].processingRunId).toBe(run?.runId);
    expect(anomalies[0].modelVersion).toBeDefined();

    // Verify mission status and anomaly count were updated
    const updatedMission = await Mission.findOne({ id: testMissionId });
    expect(updatedMission?.status).toBe('complete');
    expect(updatedMission?.anomalyCount).toBe(anomalies.length);
  });

  it('GET /missions/:missionId/anomalies should return persisted anomalies with processing run reference metadata', async () => {
    const res = await request(app)
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
