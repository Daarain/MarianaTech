import mongoose from 'mongoose';
import { config } from './env';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err: any) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB Atlas (${err.message}).`);
    console.warn(`[MongoDB Info] Make sure MONGO_URI is set in .env. Attempting fallback memory connection mode...`);
    // Connect to local or retry
    throw err;
  }
}
