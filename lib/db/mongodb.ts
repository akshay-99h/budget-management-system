import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/budget2025";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Ensure MongoDB URI includes database name
const getMongoUri = () => {
  let uri = MONGODB_URI;

  // Check if URI already has a database name
  if (uri.includes("mongodb+srv://") || uri.includes("mongodb://")) {
    // Split by / to check for database name
    const parts = uri.split("/");
    const lastPart = parts[parts.length - 1];

    // If last part is empty or starts with ?, no database name
    if (!lastPart || lastPart.startsWith("?")) {
      // Add database name before query params
      if (uri.includes("?")) {
        const [base, query] = uri.split("?");
        uri = `${base}/budget2025?${query}`;
      } else {
        uri = `${uri.replace(/\/$/, "")}/budget2025`;
      }
    }
    // If database name exists, use as is
  }

  return uri;
};

const finalMongoUri = getMongoUri();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(finalMongoUri, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ Failed to establish MongoDB connection:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
