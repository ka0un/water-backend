const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://admin:admin@server.hapangama.com:25627/water_quality_db?authSource=admin',
    options: {
      // Mongoose 6+ doesn't need these options, but kept for compatibility
    },
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, // 5 s
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300,
  },
};

module.exports = config;
