require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

// Fix Node.js on Windows ISP DNS querySrv ECONNREFUSED issue for MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // If custom DNS setting fails, default DNS will be used
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
