"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/config/database");
describe('MongoDB Atlas Database Integration Tests', () => {
    afterAll(async () => {
        await (0, database_1.disconnectDatabase)();
    });
    it('should mask sensitive credentials in MongoDB URI string', () => {
        const rawUri = 'mongodb+srv://admin_user:secret_pass_123@cluster0.mongodb.net/marianatech';
        const masked = (0, database_1.sanitizeMongoUri)(rawUri);
        expect(masked).not.toContain('admin_user');
        expect(masked).not.toContain('secret_pass_123');
        expect(masked).toContain('mongodb+srv://***:***@cluster0.mongodb.net/marianatech');
    });
    it('should expose connection state boolean via isDatabaseConnected()', () => {
        const connected = (0, database_1.isDatabaseConnected)();
        expect(typeof connected).toBe('boolean');
    });
    it('should safely execute database ping check without throwing', async () => {
        const isPingSuccess = await (0, database_1.pingDatabase)();
        expect(typeof isPingSuccess).toBe('boolean');
    });
    it('should attempt connection using connectDatabase() without crashing', async () => {
        await expect((0, database_1.connectDatabase)()).resolves.toBeDefined();
    });
});
