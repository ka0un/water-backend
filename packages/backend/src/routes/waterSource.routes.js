const express = require('express');
const waterSourceController = require('../controllers/waterSource.controller');
const waterSourceValidation = require('../validations/waterSource.validation');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /water-sources/stats:
 *   get:
 *     summary: Get water source statistics
 *     tags: [Water Sources]
 *     responses:
 *       200:
 *         description: Stats retrieved
 */
router.get(
    '/stats',
    waterSourceController.getSourceStats
);

/**
 * @swagger
 * /water-sources/nearby:
 *   get:
 *     summary: Get nearby water sources (geospatial)
 *     tags: [Water Sources]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Nearby sources retrieved
 */
router.get(
    '/nearby',
    validate(waterSourceValidation.getNearbySources),
    waterSourceController.getNearbySources
);

/**
 * @swagger
 * /water-sources:
 *   get:
 *     summary: Get all water sources with optional filters
 *     tags: [Water Sources]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: operational_status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sources retrieved
 */
router.get(
    '/',
    validate(waterSourceValidation.getWaterSources),
    waterSourceController.getSources
);

router.get(
    '/mine',
    auth,
    validate(waterSourceValidation.getWaterSources),
    waterSourceController.getMySources
);

/**
 * @swagger
 * /water-sources:
 *   post:
 *     summary: Create a new water source
 *     tags: [Water Sources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Source created
 */
router.post(
    '/',
    auth,
    validate(waterSourceValidation.createWaterSource),
    waterSourceController.createSource
);

/**
 * @swagger
 * /water-sources/{id}:
 *   get:
 *     summary: Get a single water source by ID
 *     tags: [Water Sources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Source retrieved
 */
router.get(
    '/:id',
    validate(waterSourceValidation.getWaterSourceById),
    waterSourceController.getSourceById
);

/**
 * @swagger
 * /water-sources/{id}:
 *   patch:
 *     summary: Update water source details
 *     tags: [Water Sources]
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
 *     responses:
 *       200:
 *         description: Source updated
 */
router.patch(
    '/:id',
    auth,
    validate(waterSourceValidation.updateWaterSource),
    waterSourceController.updateWaterSource
);

/**
 * @swagger
 * /water-sources/{id}/status:
 *   patch:
 *     summary: Update operational status of a water source
 *     tags: [Water Sources]
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
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
    '/:id/status',
    auth,
    validate(waterSourceValidation.updateSourceStatus),
    waterSourceController.updateSourceStatus
);

/**
 * @swagger
 * /water-sources/{id}/verify:
 *   patch:
 *     summary: Verify a water source
 *     tags: [Water Sources]
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
 *         description: Source verified
 */
router.patch(
    '/:id/verify',
    auth,
    authorize('MODERATOR', 'ADMIN'),
    validate(waterSourceValidation.verifyWaterSource),
    waterSourceController.verifyWaterSource
);

/**
 * @swagger
 * /water-sources/{id}:
 *   delete:
 *     summary: Soft delete a water source
 *     tags: [Water Sources]
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
 *         description: Source deleted
 */
router.delete(
    '/:id',
    auth,
    validate(waterSourceValidation.deleteWaterSource),
    waterSourceController.softDeleteSource
);

module.exports = router;
