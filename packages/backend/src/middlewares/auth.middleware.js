const authService = require('../services/auth.service');
const { User } = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication middleware - Protects routes by verifying JWT token
 */
const authenticate = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw ApiError.unauthorized('Access denied. No token provided.');
    }

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
        throw ApiError.unauthorized('User belonging to this token no longer exists.');
    }

    // Check if user is active
    if (!user.isActive) {
        throw ApiError.unauthorized('Account is deactivated. Please contact support.');
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        throw ApiError.unauthorized('Password recently changed. Please login again.');
    }

    // Attach user to request object
    req.user = user;
    next();
});

module.exports = authenticate;
