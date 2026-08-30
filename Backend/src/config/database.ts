import mongoose from 'mongoose';
import { config } from './env';

/**
 * Sanitizes MongoDB URI for logging to prevent credential leakage.
 */
export function sanitizeMongoUri(uri: string): string {
  if (!uri) return '[redacted]';
  return uri.replace(/\/\/(.*?)@/, '//***:***@');
}

/**
 * Reusable Mongoose connection configuration options.
 */
export const mongooseOptions: mongoose.ConnectOptions = {
  dbName: config.mongodbDbName,
  serverSelectionTimeoutMS: 5000,
  autoIndex: true,
};

let isConnectedState = false;

/**
 * Connects to MongoDB Atlas / Database on server startup.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      isConnectedState = true;
      console.log(`[Database] MongoDB connection established. (URI: ${sanitizeMongoUri(config.mongodbUri)}, DB: ${config.mongodbDbName})`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnectedState = false;
      console.warn('[Database] MongoDB connection disconnected.');
    });

    mongoose.connection.on('error', (err) => {
      isConnectedState = false;
      console.error('[Database Error]', err.message);
    });

    const conn = await mongoose.connect(config.mongodbUri, mongooseOptions);
    isConnectedState = true;
    return conn;
  } catch (error: any) {
    isConnectedState = false;
    console.warn(`[Database Warning] Could not connect to MongoDB at ${sanitizeMongoUri(config.mongodbUri)} (${error.message}).`);
    return mongoose;
  }
}

/**
 * Graceful shutdown database disconnector.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnectedState = false;
    console.log('[Database] MongoDB connection closed.');
  }
}

/**
 * Exposes database connection state for health checks.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1 || isConnectedState;
}

/**
 * Performs a simple ping query against MongoDB to verify live database connectivity.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const adminDb = mongoose.connection.db.admin();
      const pingResult = await adminDb.ping();
      return pingResult?.ok === 1;
    }
    return false;
  } catch (err: any) {
    console.error('[Database Ping Error]', err.message);
    return false;
  }
}
