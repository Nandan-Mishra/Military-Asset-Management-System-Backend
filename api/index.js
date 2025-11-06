const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = require('../app');

let cachedDb = null;
let connectionPromise = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
  }).then((conn) => {
    cachedDb = conn;
    console.log('MongoDB Connected');
    connectionPromise = null;
    return conn;
  }).catch((error) => {
    connectionPromise = null;
    console.error('MongoDB connection failed:', error.message);
    throw error;
  });

  return connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 8000)
      )
    ]);
  } catch (error) {
    console.error('Database connection error:', error.message);
    if (!res.headersSent) {
      return res.status(503).json({ 
        message: 'Database connection failed. Please check your MongoDB configuration.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  // Hand off to Express app directly (Vercel Node runtime supports this)
  return app(req, res);
};


