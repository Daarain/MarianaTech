import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedInitialUsers } from './utils/seed';
import { seedDemoAnomalies } from './utils/seedAnomalies';
import { initializeSonarWorker } from './workers/sonarWorker';

const server = http.createServer(app);

async function startServer(): Promise<void> {
  // Connect to MongoDB
  await connectDatabase();

  // Seed default development users and demo anomalies
  await seedInitialUsers();
  await seedDemoAnomalies();

  // Initialize BullMQ background worker
  initializeSonarWorker();

  // Listen on configured port
  server.listen(config.port, () => {
    console.log(`==================================================`);
    console.log(`Service: ${config.serviceName}`);
    console.log(`Environment: ${config.env}`);
    console.log(`Server listening on port: ${config.port}`);
    console.log(`Health Endpoint: http://localhost:${config.port}/api/v1/health`);
    console.log(`Auth Login Endpoint: http://localhost:${config.port}/auth/login`);
    console.log(`==================================================`);
  });
}

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] Closed HTTP server.');
    try {
      await disconnectDatabase();
      console.log('[Server] Graceful shutdown complete.');
      process.exit(0);
    } catch (err: any) {
      console.error('[Server Error] Error during graceful shutdown:', err.message);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[Server Error] Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer().catch((error) => {
  console.error('[Server Error] Failed to start server:', error);
  process.exit(1);
});
