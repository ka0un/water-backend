const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const ApiResponse = require('../utils/ApiResponse');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const moderationRoutes = require('./moderation.routes');
const waterSourceRoutes = require('./waterSource.routes');
const publicReportRoutes = require('./publicReport.routes');
const publicReportAdminRoutes = require('./publicReportAdmin.routes');


const router = express.Router();

/**
 * @route GET /api/v1/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
        system: {
            platform: os.platform(),
            cpus: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
        },
    };

    return ApiResponse.success(res, healthCheck, 'Server is healthy');
});

/**
 * @route GET /api/v1/
 * @desc API info endpoint
 * @access Public
 */
router.get('/', (req, res) => {
    return ApiResponse.success(res, {
        name: 'Water Quality Report API',
        version: '1.0.0',
        description: 'Crowdsourced water quality report system API',
        documentation: '/api/v1/docs',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            admin: '/api/v1/admin',
            moderation: '/api/v1/moderation',
            waterSources: '/api/v1/water-sources',
            publicReports: '/api/v1/public-reports',
            publicReportsAdmin: '/api/v1/public-reports-admin',
            health: '/api/v1/health',
        },
    }, 'Welcome to Water Quality Report API');
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/moderation', moderationRoutes);
router.use('/water-sources', waterSourceRoutes);
router.use('/public-reports', publicReportRoutes);
router.use('/public-reports-admin', publicReportAdminRoutes);

module.exports = router;
