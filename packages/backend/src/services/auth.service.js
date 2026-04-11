const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw ApiError.unauthorized('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw ApiError.unauthorized('Invalid token');
        }
        throw ApiError.unauthorized('Token verification failed');
    }
};

/**
 * Register a new user
 */
const register = async (userData) => {
    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        throw ApiError.conflict('Email already registered');
    }

    // Create new user
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'USER',
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${email}`);

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        },
        token,
    };
};

/**
 * Login user
 */
const login = async (email, password) => {
    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
        throw ApiError.unauthorized('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const { ModerationLog, ModerationAction } = require('../models/ModerationLog.model');

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${email}`);

    // If user is moderator or admin, log their login action
    if (['MODERATOR', 'ADMIN'].includes(user.role)) {
        await ModerationLog.create({
            action: ModerationAction.LOGIN,
            moderatorId: user._id,
        }).catch(err => logger.error('Failed to log moderator login:', err));
    }

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
        },
        token,
    };
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw ApiError.notFound('User not found');
    }
    return user;
};

module.exports = {
    generateToken,
    verifyToken,
    register,
    login,
    getUserById,
};
