import {
  sanitizeMongoUri,
  isDatabaseConnected,
  pingDatabase,
  connectDatabase,
  disconnectDatabase,
} from '../src/config/database';

describe('MongoDB Atlas Database Integration Tests', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should mask sensitive credentials in MongoDB URI string', () => {
    const rawUri = 'mongodb+srv://admin_user:secret_pass_123@cluster0.mongodb.net/marianatech';
    const masked = sanitizeMongoUri(rawUri);
    expect(masked).not.toContain('admin_user');
    expect(masked).not.toContain('secret_pass_123');
    expect(masked).toContain('mongodb+srv://***:***@cluster0.mongodb.net/marianatech');
  });

  it('should expose connection state boolean via isDatabaseConnected()', () => {
    const connected = isDatabaseConnected();
    expect(typeof connected).toBe('boolean');
  });

  it('should safely execute database ping check without throwing', async () => {
    const isPingSuccess = await pingDatabase();
    expect(typeof isPingSuccess).toBe('boolean');
  });

  it('should attempt connection using connectDatabase() without crashing', async () => {
    await expect(connectDatabase()).resolves.toBeDefined();
  });
});
