const serverless = require('serverless-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = require('../app');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    cachedDb = conn;
    console.log('MongoDB Connected');
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

const handler = serverless(app);

module.exports = async (req, res) => {
  await connectToDatabase();
  return handler(req, res);
};


