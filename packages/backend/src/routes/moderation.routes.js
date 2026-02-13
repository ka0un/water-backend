const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { UserRole } = require('../models/User.model');
const {
    getModerationLogs,
    createSampleModerationLog,
} = require('../controllers/moderationLog.controller');

const router = express.Router();

/**
 * @route GET /api/v1/moderation/logs
 * @desc Get moderation logs (paginated, filterable)
 * @access Private (ADMIN, MODERATOR)
 */
router.get(
    '/logs',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.MODERATOR),
    getModerationLogs
);

/**
 * @route POST /api/v1/moderation/logs/sample
 * @desc Create a sample moderation log entry (for testing)
 * @access Private (ADMIN, MODERATOR)
 */
router.post(
    '/logs/sample',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.MODERATOR),
    createSampleModerationLog
);

module.exports = router;

