import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import missionRoutes from './routes/missionRoutes';
import anomalyRoutes from './routes/anomalyRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { downloadReport } from './controllers/reportController';

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (tiles, report downloads)
app.use('/uploads', express.static(config.uploadsDir));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Node.js Express Backend', timestamp: new Date() });
});

// Primary Routes matching Frontend contract directly
app.use('/auth', authRoutes);
app.use('/missions', missionRoutes);
app.use('/anomalies', anomalyRoutes);
app.get('/reports/download/:filename', downloadReport);

// Also mount under /api prefix for versatility
app.use('/api/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/anomalies', anomalyRoutes);

// Error Handler
app.use(errorHandler);

// Start HTTP server immediately
const server = app.listen(config.port, () => {
  console.log(`==================================================`);
  console.log(`MarianaTech Node Backend running on port ${config.port}`);
  console.log(`Frontend API URL: http://localhost:${config.port}`);
  console.log(`==================================================`);
});

// Connect to MongoDB Atlas in background
connectDB().catch((err) => {
  console.warn(`[Server Notice] Running with local seed fallback (${err.message})`);
});

export default app;
