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
  let uri = MONGODB_URI.trim();

  // Check if URI already has a database name
  if (uri.includes("mongodb+srv://") || uri.includes("mongodb://")) {
    // Extract the protocol
    const protocol = uri.includes("mongodb+srv://") ? "mongodb+srv://" : "mongodb://";
    const afterProtocol = uri.replace(protocol, "");
    
    // Find where the query string starts
    const queryIndex = afterProtocol.indexOf("?");
    const beforeQuery = queryIndex > 0 ? afterProtocol.substring(0, queryIndex) : afterProtocol;
    const queryString = queryIndex > 0 ? afterProtocol.substring(queryIndex) : "";
    
    // Check if beforeQuery has a database name (contains a / with text after it)
    // Examples:
    // - "user:pass@host" -> no database
    // - "user:pass@host/" -> no database (trailing slash)
    // - "user:pass@host/dbname" -> has database
    const lastSlashIndex = beforeQuery.lastIndexOf("/");
    const hasDatabaseName = lastSlashIndex > 0 && lastSlashIndex < beforeQuery.length - 1;
    
    if (!hasDatabaseName) {
      // No database name, add it
      // Remove trailing slash if present
      const cleanHost = beforeQuery.replace(/\/$/, "");
      uri = `${protocol}${cleanHost}/budget2025${queryString}`;
    } else {
      // Database name already exists, use as is
      uri = MONGODB_URI;
    }
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
    // Extract database name from URI for explicit configuration
    let dbName = "budget2025";
    try {
      const uriMatch = finalMongoUri.match(/\/([^/?]+)(\?|$)/);
      if (uriMatch && uriMatch[1] && uriMatch[1] !== "") {
        dbName = uriMatch[1];
      }
    } catch (e) {
      // Use default if extraction fails
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: dbName, // Explicitly set database name
    };

    // Log the URI (without password) for debugging
    const safeUri = finalMongoUri.replace(/:([^:@]+)@/, ":****@");
    console.log("🔗 Connecting to MongoDB:", safeUri);
    console.log("📊 Database name:", dbName);

    cached.promise = mongoose
      .connect(finalMongoUri, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        console.log("📊 Connected database:", mongoose.connection.db?.databaseName);
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        console.error("🔍 Full error:", error);
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
