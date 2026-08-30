import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { requestLogger } from './utils/logger';
import apiRoutes from './routes';
import authRoutes from './routes/auth.routes';
import missionRoutes from './routes/mission.routes';
import anomalyRoutes from './routes/anomaly.routes';
import jobRoutes from './routes/job.routes';
import { getReportFileHandler } from './controllers/report.controller';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { globalLimiter } from './middleware/rateLimit.middleware';

const app: Application = express();

// Trust proxy setting for deployment environments (Nginx, ALB, Cloudflare)
if (config.trustProxy) {
  app.set('trust proxy', config.trustProxy === 'true' ? true : parseInt(config.trustProxy, 10) || 1);
}

// Security & utility middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Global Rate Limiter applied to all incoming API requests (bypasses health check)
app.use(globalLimiter);

// Direct compatibility routes for existing frontend (/auth, /missions, /anomalies, /jobs)
app.use('/auth', authRoutes);
app.use('/missions', missionRoutes);
app.use('/anomalies', anomalyRoutes);
app.use('/jobs', jobRoutes);
app.get('/reports/file/:reportId', getReportFileHandler);

// Primary Versioned API Router (/api/v1/health, /api/v1/auth, /api/v1/missions, /api/v1/anomalies, /api/v1/jobs)
app.use('/api', apiRoutes);

// Unmatched routes 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
