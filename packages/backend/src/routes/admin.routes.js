const express = require('express');
const { User, UserRole } = require('../models/User.model');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const router = express.Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req, res) => {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
    ]);

    const roleStats = usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});

    return ApiResponse.success(res, {
        stats: {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            usersByRole: roleStats,
        },
    }, 'Dashboard stats retrieved successfully');
}));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users with advanced filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.get('/users', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [users, total] = await Promise.all([
        User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        User.countDocuments(filter),
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

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/users/:userId/role', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
        throw ApiError.badRequest(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    return ApiResponse.success(res, { user }, 'User role updated successfully');
}));

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   patch:
 *     summary: Activate/Deactivate user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/users/:userId/status', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw ApiError.badRequest('isActive must be a boolean');
    }

    // Prevent self-deactivation
    if (userId === req.user._id.toString() && !isActive) {
        throw ApiError.badRequest('You cannot deactivate your own account');
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    return ApiResponse.success(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
}));

// Laboratory routes
const laboratoryRoutes = require('./laboratory.routes');
router.use('/laboratories', laboratoryRoutes);

module.exports = router;
