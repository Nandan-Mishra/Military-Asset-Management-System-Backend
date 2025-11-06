const serverless = require('serverless-http');
const dotenv = require('dotenv');
const connectDB = require('../config/database');

dotenv.config();
connectDB();

const app = require('../app');

module.exports = serverless(app);


