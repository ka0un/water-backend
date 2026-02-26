const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/water_quality_db',
    options: {
      // Mongoose 6+ doesn't need these options, but kept for compatibility
    },
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 5 * 1000, // 5 s
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 20,
  },
};

module.exports = config;
