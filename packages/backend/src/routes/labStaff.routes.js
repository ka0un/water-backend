const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const {
    getDashboardStats,
    listRequests,
    getRequest,
    acceptRequest,
    rejectRequest,
    scheduleCollection,
    recordSampleCollection,
    startTesting,
    inputTestResults,
    completeTestingAndIssueVerdict,
    getSafeLimits,
    getActiveLaboratories,
} = require('../controllers/labStaff.controller');

// All routes require authentication and LAB_STAFF or ADMIN role
router.use(authenticate);
router.use(authorize('LAB_STAFF', 'ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Lab Staff
 *   description: Laboratory staff test management
 */

/**
 * @swagger
 * /lab-staff/dashboard:
 *   get:
 *     summary: Get lab staff dashboard statistics
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /lab-staff/laboratories:
 *   get:
 *     summary: Get all active laboratories
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active laboratories retrieved
 */
router.get('/laboratories', getActiveLaboratories);

/**
 * @swagger
 * /lab-staff/requests:
 *   get:
 *     summary: List all lab test requests
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_acceptance, accepted, sample_scheduled, sample_collected, testing_in_progress, completed, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: List of lab test requests
 */
router.get('/requests', listRequests);

/**
 * @swagger
 * /lab-staff/safe-limits:
 *   get:
 *     summary: Get water quality safe limits reference
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Safe limits retrieved
 */
router.get('/safe-limits', getSafeLimits);

/**
 * @swagger
 * /lab-staff/requests/{id}:
 *   get:
 *     summary: Get a single lab test request
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab test request ID
 *     responses:
 *       200:
 *         description: Lab test request details
 *       404:
 *         description: Request not found
 */
router.get('/requests/:id', getRequest);

/**
 * @swagger
 * /lab-staff/requests/{id}/accept:
 *   post:
 *     summary: Accept a lab test request
 *     tags: [Lab Staff]
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
 *         description: Request accepted
 */
router.post('/requests/:id/accept', acceptRequest);

/**
 * @swagger
 * /lab-staff/requests/{id}/reject:
 *   post:
 *     summary: Reject a lab test request
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.post('/requests/:id/reject', rejectRequest);

/**
 * @swagger
 * /lab-staff/requests/{id}/schedule:
 *   post:
 *     summary: Schedule sample collection
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - timeSlot
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *                 example: "10:00 AM - 12:00 PM"
 *               assignedCollector:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collection scheduled
 */
router.post('/requests/:id/schedule', scheduleCollection);

/**
 * @swagger
 * /lab-staff/requests/{id}/collect:
 *   post:
 *     summary: Record sample collection details
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               address:
 *                 type: string
 *               sampleId:
 *                 type: string
 *               bottleType:
 *                 type: string
 *               volumeCollected:
 *                 type: number
 *               waterTemperature:
 *                 type: number
 *               weatherConditions:
 *                 type: string
 *               notes:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Sample collection recorded
 */
router.post('/requests/:id/collect', recordSampleCollection);

/**
 * @swagger
 * /lab-staff/requests/{id}/start-testing:
 *   post:
 *     summary: Start testing a sample
 *     tags: [Lab Staff]
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
 *         description: Testing started
 */
router.post('/requests/:id/start-testing', startTesting);

/**
 * @swagger
 * /lab-staff/requests/{id}/results:
 *   put:
 *     summary: Input test results
 *     tags: [Lab Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               results:
 *                 type: object
 *                 description: Object with parameter names as keys
 *                 example:
 *                   ph: { value: 7.2 }
 *                   lead: { value: 0.05, notes: "High contamination" }
 *               labNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Results updated
 */
router.put('/requests/:id/results', inputTestResults);

/**
 * @swagger
 * /lab-staff/requests/{id}/complete:
 *   post:
 *     summary: Complete testing and issue verdict
 *     tags: [Lab Staff]
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
 *             properties:
 *               recommendations:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Testing completed, verdict issued
 */
router.post('/requests/:id/complete', completeTestingAndIssueVerdict);

module.exports = router;
