import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { Mission } from '../src/models/mission.model';
import { AnomalyModel } from '../src/models/anomaly.model';
import { ProcessingJobModel } from '../src/models/processingJob.model';
import {
  validateFastAPIResponse,
  requestInferenceFromFastAPI,
  generateMockAIResponse,
} from '../src/services/ai.service';
import { closeRedisQueue } from '../src/queue/sonarQueue';
import { closeSonarWorker } from '../src/workers/sonarWorker';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Node.js to FastAPI AI Integration Tests', () => {
  let createdMissionId: string;
  let authToken: string;

  beforeAll(async () => {
    await connectDatabase();
    await Mission.deleteMany({});
    await AnomalyModel.deleteMany({});
    await ProcessingJobModel.deleteMany({});

    authToken = jwt.sign(
      { id: 'test-user-id', username: 'operator', name: 'Lt. R. Mehta', role: 'operator' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const mission = await Mission.create({
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
    await closeSonarWorker();
    await closeRedisQueue();
    await disconnectDatabase();
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

    expect(validateFastAPIResponse(validPayload)).toBe(true);

    expect(() => validateFastAPIResponse(null)).toThrow('Response is not an object');
    expect(() => validateFastAPIResponse({ status: 'completed' })).toThrow('Missing or invalid jobId');
    expect(() => validateFastAPIResponse({ jobId: 'J1', status: 'completed', anomalies: 'not-an-array' })).toThrow(
      'anomalies field must be an array'
    );
  });

  it('generateMockAIResponse should return response matching exact FastAPI schema', () => {
    const req = {
      jobId: 'JOB-2026-0001',
      missionId: 'MSN-2026-0999',
      inputReference: 'sonar_scan_ref',
    };

    const res = generateMockAIResponse(req);
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

    const res = await requestInferenceFromFastAPI(reqPayload, 2, 1000);
    expect(res).toHaveProperty('jobId', 'JOB-2026-0002');
    expect(res).toHaveProperty('status', 'completed');
    expect(Array.isArray(res.anomalies)).toBe(true);
  });

  it('triggering mission processing should invoke AI service pipeline and populate anomalies in MongoDB', async () => {
    const processRes = await request(app)
      .post(`/missions/${createdMissionId}/process`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(processRes.status).toBe(202);

    const anomaliesRes = await request(app)
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
