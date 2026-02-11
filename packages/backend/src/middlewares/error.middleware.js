const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// HTTP Status codes
const HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};

/**
 * Convert non-ApiError to ApiError
 */
const errorConverter = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, false, err.stack);
        // Preserve the original errors if present
        if (err.errors) {
            error.errors = err.errors;
        }
    }

    next(error);
};

/**
 * Handle errors and send response
 */
const errorHandler = (err, req, res, next) => {
    // Ensure statusCode is always a valid integer
    let statusCode = err.statusCode;
    if (!statusCode || typeof statusCode !== 'number') {
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }

    let { message } = err;
    if (!message) {
        message = 'Internal Server Error';
    }

    // In production, don't expose internal error details
    if (config.env === 'production' && !err.isOperational) {
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        message = 'Internal Server Error';
    }

    // Log error
    const errorLog = {
        statusCode,
        message,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
    };

    if (config.env === 'development') {
        errorLog.stack = err.stack;
    }

    if (statusCode >= 500) {
        logger.error('Server Error', errorLog);
    } else {
        logger.warn('Client Error', errorLog);
    }

    // Build error response
    const response = {
        success: false,
        statusCode,
        message,
        timestamp: new Date().toISOString(),
    };

    // Include validation errors if present
    if (err.errors) {
        response.errors = err.errors;
    }

    // Include stack trace in development
    if (config.env === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * Handle 404 Not Found
 */
const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = {
    errorConverter,
    errorHandler,
    notFoundHandler,
};
