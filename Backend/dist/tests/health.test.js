"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
describe('Backend Foundation Health Endpoint', () => {
    it('GET /api/v1/health should return 200 OK and valid health response', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('service', 'marianatech-backend');
        expect(res.body).toHaveProperty('database');
        expect(res.body).toHaveProperty('timestamp');
    });
    it('GET /unknown-route should return 404 Not Found', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/unknown-route');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
});
