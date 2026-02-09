const express = require('express');
const { User, UserRole } = require('../models/User.model');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        createdAt: req.user.createdAt,
        lastLoginAt: req.user.lastLoginAt,
    };

    return ApiResponse.success(res, { user }, 'Profile retrieved successfully');
}));

/**
 * @route GET /api/v1/users
 * @desc Get all users (Admin & Moderator only)
 * @access Private (ADMIN, MODERATOR)
 */
router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.MODERATOR), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
        User.countDocuments(),
    ]);

    return ApiResponse.success(res, {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    }, 'Users retrieved successfully');
}));

module.exports = router;
