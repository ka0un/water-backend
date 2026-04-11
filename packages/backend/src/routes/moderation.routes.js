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
 * @swagger
 * /moderation/logs:
 *   get:
 *     summary: Get moderation logs
 *     tags: [Moderation]
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
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: moderatorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Moderation logs retrieved
 */
router.get(
    '/logs',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.MODERATOR),
    getModerationLogs
);

module.exports = router;

