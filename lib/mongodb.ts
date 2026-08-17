import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cached;

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (!MONGODB_URI) return true;
  if (
    MONGODB_URI.includes("username:password") ||
    MONGODB_URI.includes("cluster.mongodb.net") ||
    MONGODB_URI.includes("replace_me") ||
    MONGODB_URI === "placeholder"
  ) {
    return true;
  }
  return false;
}

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (isDemoMode() || !MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured (running in demo mode).");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
