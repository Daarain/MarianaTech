import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/user.model';

const testUsername = `auth_test_${Date.now()}`;
const testPassword = 'test-password-only';
const testName = 'Authentication Test User';

describe('Authentication API Endpoint Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    await User.create({
      username: testUsername,
      passwordHash: await bcrypt.hash(testPassword, 10),
      name: testName,
      role: 'operator',
      isActive: true,
    });
  });

  afterAll(async () => {
    await User.deleteOne({ username: testUsername });
    await disconnectDatabase();
  });

  it('POST /auth/login should authenticate an existing MongoDB user and return frontend-compatible payload', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: testUsername, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user', testName);
    expect(res.body).toHaveProperty('role', 'operator');
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /auth/login should accept a case-insensitive username lookup', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: testUsername.toUpperCase(), password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user', testName);
    expect(res.body).toHaveProperty('role', 'operator');
    expect(res.body).toHaveProperty('token');
  });

  it('POST /auth/login should fail for invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: testUsername, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /auth/me should return authenticated user profile with Bearer token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: testUsername, password: testPassword });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('username', testUsername);
    expect(meRes.body).toHaveProperty('role', 'operator');
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
