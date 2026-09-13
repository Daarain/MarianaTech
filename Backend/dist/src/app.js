"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const routes_1 = __importDefault(require("./routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const mission_routes_1 = __importDefault(require("./routes/mission.routes"));
const anomaly_routes_1 = __importDefault(require("./routes/anomaly.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const report_controller_1 = require("./controllers/report.controller");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const app = (0, express_1.default)();
// Trust proxy setting for deployment environments (Nginx, ALB, Cloudflare)
if (env_1.config.trustProxy) {
    app.set('trust proxy', env_1.config.trustProxy === 'true' ? true : parseInt(env_1.config.trustProxy, 10) || 1);
}
// Security & utility middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.config.corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_1.requestLogger);
// Global Rate Limiter applied to all incoming API requests (bypasses health check)
app.use(rateLimit_middleware_1.globalLimiter);
// Direct compatibility routes for existing frontend (/auth, /missions, /anomalies, /jobs)
app.use('/auth', auth_routes_1.default);
app.use('/missions', mission_routes_1.default);
app.use('/anomalies', anomaly_routes_1.default);
app.use('/jobs', job_routes_1.default);
app.get('/reports/file/:reportId', report_controller_1.getReportFileHandler);
// Primary Versioned API Router (/api/v1/health, /api/v1/auth, /api/v1/missions, /api/v1/anomalies, /api/v1/jobs)
app.use('/api', routes_1.default);
// Unmatched routes 404 handler
app.use(notFoundHandler_1.notFoundHandler);
// Centralized error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
