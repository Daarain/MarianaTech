import request from 'supertest';
import app from '../src/app';

describe('Backend Foundation Health Endpoint', () => {
  it('GET /api/v1/health should return 200 OK and valid health response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'marianatech-backend');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /unknown-route should return 404 Not Found', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
