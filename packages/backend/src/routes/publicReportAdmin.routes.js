const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const {
    listReports,
    getStats,
    getReportDetail,
    getImage,
    moderateReport,
    adminUpdateReport,
    deleteReport,
    deleteByNic,
    resetAll,
    exportReports,
    getSecurityInfo,
    banUser,
} = require('../controllers/publicReportAdmin.controller');

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

// ── MODERATOR + ADMIN ─────────────────────────────────────────────

/**
 * @route   GET /api/v1/public-reports-admin
 * @desc    List all reports (paginated, filterable)
 * @access  MODERATOR, ADMIN
 */
router.get('/', authorize('MODERATOR', 'ADMIN'), listReports);

/**
 * @route   GET /api/v1/public-reports-admin/stats
 * @desc    Report statistics and aggregations
 * @access  MODERATOR, ADMIN
 */
router.get('/stats', authorize('MODERATOR', 'ADMIN'), getStats);

/**
 * @route   GET /api/v1/public-reports-admin/export
 * @desc    Export reports as JSON file
 * @access  MODERATOR, ADMIN
 */
router.get('/export', authorize('MODERATOR', 'ADMIN'), exportReports);

/**
 * @route   POST /api/v1/public-reports-admin/ban
 * @desc    Ban a specific IP or NIC
 * @access  MODERATOR, ADMIN
 */
router.post('/ban', authorize('MODERATOR', 'ADMIN'), banUser);

/**
 * @route   GET /api/v1/public-reports-admin/:id/security
 * @desc    Get security stats for a given report's owner (IP/NIC)
 * @access  MODERATOR, ADMIN
 */
router.get('/:id/security', authorize('MODERATOR', 'ADMIN'), getSecurityInfo);

/**
 * @route   GET /api/v1/public-reports-admin/:id
 * @desc    Get full report detail (with image metadata)
 * @access  MODERATOR, ADMIN
 */
router.get('/:id', authorize('MODERATOR', 'ADMIN'), getReportDetail);

/**
 * @route   GET /api/v1/public-reports-admin/:id/images/:imageId
 * @desc    Serve a specific image (binary)
 * @access  MODERATOR, ADMIN
 */
router.get('/:id/images/:imageId', authorize('MODERATOR', 'ADMIN'), getImage);

/**
 * @route   PATCH /api/v1/public-reports-admin/:id/moderate
 * @desc    Approve or reject a report
 * @access  MODERATOR, ADMIN
 */
router.patch('/:id/moderate', authorize('MODERATOR', 'ADMIN'), moderateReport);

// ── ADMIN ONLY ────────────────────────────────────────────────────

/**
 * @route   PATCH /api/v1/public-reports-admin/:id
 * @desc    Admin override — update any field
 * @access  ADMIN
 */
router.patch('/:id', authorize('ADMIN'), adminUpdateReport);

/**
 * @route   DELETE /api/v1/public-reports-admin/:id
 * @desc    Delete a single report
 * @access  ADMIN
 */
router.delete('/:id', authorize('ADMIN'), deleteReport);

/**
 * @route   DELETE /api/v1/public-reports-admin/by-nic/:nic
 * @desc    Delete all reports for a NIC
 * @access  ADMIN
 */
router.delete('/by-nic/:nic', authorize('ADMIN'), deleteByNic);

/**
 * @route   POST /api/v1/public-reports-admin/reset
 * @desc    Delete ALL reports (non-production only)
 * @access  ADMIN
 */
router.post('/reset', authorize('ADMIN'), resetAll);

module.exports = router;
