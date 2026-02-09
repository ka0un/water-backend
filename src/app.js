const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const { errorConverter, errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.env === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Response compression
app.use(compression());

// HTTP request logging
const morganFormat = config.env === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: logger.stream }));

// API routes
app.use('/api/v1', routes);

// Handle 404 routes
app.use(notFoundHandler);

// Convert errors to ApiError
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;
