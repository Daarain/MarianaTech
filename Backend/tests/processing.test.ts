import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { Mission } from '../src/models/mission.model';
import { ProcessingJobModel } from '../src/models/processingJob.model';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('STEP 8: Asynchronous Processing Subsystem Tests', () => {
  let testMissionId: string;
  let createdJobId: string;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await Mission.deleteMany({});
    await ProcessingJobModel.deleteMany({});

    authToken = jwt.sign(
      { id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const mission = await Mission.create({
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
    await disconnectDatabase();
  });

  it('POST /missions/:missionId/process should create a ProcessingJob in MongoDB and return 202 Accepted immediately', async () => {
    const res = await request(app)
      .post(`/missions/${testMissionId}/process`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('currentStage');

    createdJobId = res.body.jobId;
  });

  it('GET /jobs/:jobId should retrieve the status, progress, and stage of a processing job', async () => {
    const res = await request(app)
      .get(`/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobId', createdJobId);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('currentStage');
    expect(res.body).toHaveProperty('progress');
  });

  it('POST /jobs/:jobId/retry should re-queue a job and reset its execution state', async () => {
    const res = await request(app)
      .post(`/jobs/${createdJobId}/retry`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobId', createdJobId);
    expect(res.body).toHaveProperty('status');
  });
});
