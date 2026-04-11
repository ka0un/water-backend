const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { ModerationLog, ModerationAction } = require('../models/ModerationLog.model');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const result = await authService.register({ name, email, password, role });

    return ApiResponse.created(res, result, 'User registered successfully');
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    return ApiResponse.success(res, result, 'Login successful');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
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
});

/**
 * @desc    Logout user (simply to log the action for moderators)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    if (['MODERATOR', 'ADMIN'].includes(req.user.role)) {
        await ModerationLog.create({
            action: ModerationAction.LOGOUT,
            moderatorId: req.user._id,
        }).catch(() => { }); // fire and forget
    }
    return ApiResponse.success(res, null, 'Logged out successfully');
});

module.exports = {
    register,
    login,
    getMe,
    logout,
};
