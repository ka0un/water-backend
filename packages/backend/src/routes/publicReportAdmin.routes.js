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
    unbanUser,
} = require('../controllers/publicReportAdmin.controller');

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

// ── MODERATOR + ADMIN ─────────────────────────────────────────────

/**
 * @swagger
 * /public-reports-admin:
 *   get:
 *     summary: List all reports (paginated)
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get('/', authorize('MODERATOR', 'ADMIN'), listReports);

/**
 * @swagger
 * /public-reports-admin/stats:
 *   get:
 *     summary: Report statistics
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats aggregations
 */
router.get('/stats', authorize('MODERATOR', 'ADMIN'), getStats);

/**
 * @swagger
 * /public-reports-admin/export:
 *   get:
 *     summary: Export reports as JSON
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Downloadable JSON
 */
router.get('/export', authorize('MODERATOR', 'ADMIN'), exportReports);

/**
 * @swagger
 * /public-reports-admin/ban:
 *   post:
 *     summary: Ban a specific IP or NIC
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Banned
 */
router.post('/ban', authorize('MODERATOR', 'ADMIN'), banUser);

/**
 * @swagger
 * /public-reports-admin/unban:
 *   post:
 *     summary: Unban an IP or NIC
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Unbanned
 */
router.post('/unban', authorize('MODERATOR', 'ADMIN'), unbanUser);

/**
 * @swagger
 * /public-reports-admin/{id}/security:
 *   get:
 *     summary: Get security stats for report owner
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security stats
 */
router.get('/:id/security', authorize('MODERATOR', 'ADMIN'), getSecurityInfo);

/**
 * @swagger
 * /public-reports-admin/{id}:
 *   get:
 *     summary: Get full report detail
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full report representation
 */
router.get('/:id', authorize('MODERATOR', 'ADMIN'), getReportDetail);

/**
 * @swagger
 * /public-reports-admin/{id}/images/{imageId}:
 *   get:
 *     summary: Serve specific image payload
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Binary Image stream
 */
router.get('/:id/images/:imageId', authorize('MODERATOR', 'ADMIN'), getImage);

/**
 * @swagger
 * /public-reports-admin/{id}/moderate:
 *   patch:
 *     summary: Approve or reject report
 *     tags: [Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Moderation applied
 */
router.patch('/:id/moderate', authorize('MODERATOR', 'ADMIN'), moderateReport);

// ── ADMIN ONLY ────────────────────────────────────────────────────

/**
 * @swagger
 * /public-reports-admin/{id}:
 *   patch:
 *     summary: Admin override update any field
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Overridden report
 */
router.patch('/:id', authorize('ADMIN'), adminUpdateReport);

/**
 * @swagger
 * /public-reports-admin/{id}:
 *   delete:
 *     summary: Soft delete single report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', authorize('ADMIN'), deleteReport);

/**
 * @swagger
 * /public-reports-admin/by-nic/{nic}:
 *   delete:
 *     summary: Delete all reports for an NIC
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted batch
 */
router.delete('/by-nic/:nic', authorize('ADMIN'), deleteByNic);

/**
 * @swagger
 * /public-reports-admin/reset:
 *   post:
 *     summary: Delete ALL reports (dev only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DB resetted
 */
router.post('/reset', authorize('ADMIN'), resetAll);

module.exports = router;
