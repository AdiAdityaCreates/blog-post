require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

// Use public DNS only for the Windows-specific Atlas SRV lookup workaround.
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (err) {
    console.warn(`Could not configure DNS servers: ${err.message}`);
  }
}

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGO_URI).then((conn) => conn.connection);
    const conn = await connectionPromise;
    console.log(`MongoDB connected: ${conn.host}`);
    return conn;
  } catch (err) {
    connectionPromise = null;
    console.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

module.exports = connectDB;
