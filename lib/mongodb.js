import mongoose from "mongoose";

const DEFAULT_MONGODB_URI = "mongodb://pnpm:LondonPro123@ac-o1zhzjv-shard-00-00.dgozhkf.mongodb.net:27017,ac-o1zhzjv-shard-00-01.dgozhkf.mongodb.net:27017,ac-o1zhzjv-shard-00-02.dgozhkf.mongodb.net:27017/?replicaSet=atlas-2xcb70-shard-0&ssl=true&authSource=admin";
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    }).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

export default connectDB;
