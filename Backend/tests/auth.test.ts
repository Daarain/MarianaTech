import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { seedInitialUsers } from '../src/utils/seed';

describe('Authentication API Endpoint Tests', () => {
  let adminToken = '';

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

    adminToken = res.body.token;
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

  it('POST /auth/register should create a user with a hashed password and allow login', async () => {
    const username = `newoperator_${Date.now()}`;
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'New Operator', username, password: 'newpass123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('username', username);
    expect(res.body.user).toHaveProperty('role', 'operator');

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username, password: 'newpass123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('role', 'operator');
    expect(loginRes.body).toHaveProperty('token');
  });

  it('POST /auth/login should fail for invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /auth/me should return authenticated user profile with ******', async () => {
    const token = adminToken;

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
