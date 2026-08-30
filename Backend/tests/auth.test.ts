import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { seedInitialUsers } from '../src/utils/seed';

describe('Authentication API Endpoint Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    await seedInitialUsers();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('POST /auth/login should authenticate admin and return frontend-compatible payload', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user', 'Cdr. A. Fernando');
    expect(res.body).toHaveProperty('role', 'admin');
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /auth/login should authenticate operator and return frontend-compatible payload', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'operator', password: 'operator123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user', 'Lt. R. Mehta');
    expect(res.body).toHaveProperty('role', 'operator');
    expect(res.body).toHaveProperty('token');
  });

  it('POST /auth/login should fail for invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /auth/me should return authenticated user profile with Bearer token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('username', 'admin');
    expect(meRes.body).toHaveProperty('role', 'admin');
    expect(meRes.body).not.toHaveProperty('passwordHash');
  });

  it('GET /auth/me should reject requests without token', async () => {
    const meRes = await request(app).get('/auth/me');
    expect(meRes.status).toBe(401);
  });

  it('POST /auth/logout should return 200 OK', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});
