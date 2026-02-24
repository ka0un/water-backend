const express = require('express');
const waterSourceController = require('../controllers/waterSource.controller');
const waterSourceValidation = require('../validations/waterSource.validation');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

/**
 * @route   GET /api/v1/water-sources/stats
 * @desc    Get water source statistics
 * @access  Public
 */
router.get(
    '/stats',
    waterSourceController.getSourceStats
);

/**
 * @route   GET /api/v1/water-sources/nearby
 * @desc    Get nearby water sources (geospatial query)
 * @access  Public
 * 
 * Query params:
 * - latitude (required)
 * - longitude (required)
 * - radius (optional, default: 5000m)
 * - type (optional)
 * - operational_status (optional)
 */
router.get(
    '/nearby',
    validate(waterSourceValidation.getNearbySources),
    waterSourceController.getNearbySources
);

/**
 * @route   GET /api/v1/water-sources
 * @desc    Get all water sources with optional filters
 * @access  Public
 * 
 * Query params:
 * - type (optional)
 * - operational_status (optional)
 * - access_type (optional)
 * - verified (optional)
 * - page (optional, default: 1)
 * - limit (optional, default: 10)
 * - sort (optional, default: -createdAt)
 */
router.get(
    '/',
    validate(waterSourceValidation.getWaterSources),
    waterSourceController.getSources
);

/**
 * @route   POST /api/v1/water-sources
 * @desc    Create a new water source
 * @access  Private (authenticated users)
 * 
 * Body:
 * - name (required)
 * - type (required)
 * - location: { latitude, longitude } (required)
 * - operational_status (optional)
 * - access_type (optional)
 * - description (optional)
 */
router.post(
    '/',
    auth,
    validate(waterSourceValidation.createWaterSource),
    waterSourceController.createSource
);

/**
 * @route   GET /api/v1/water-sources/:id
 * @desc    Get a single water source by ID
 * @access  Public
 */
router.get(
    '/:id',
    validate(waterSourceValidation.getWaterSourceById),
    waterSourceController.getSourceById
);

/**
 * @route   PATCH /api/v1/water-sources/:id
 * @desc    Update water source details
 * @access  Private (Creator, Moderator, or Admin)
 * 
 * Body (all optional, at least one required):
 * - name
 * - type
 * - operational_status
 * - access_type
 * - description
 */
router.patch(
    '/:id',
    auth,
    validate(waterSourceValidation.updateWaterSource),
    waterSourceController.updateWaterSource
);

/**
 * @route   PATCH /api/v1/water-sources/:id/status
 * @desc    Update operational status of a water source
 * @access  Private (Admin or users with verified status)
 * 
 * Body:
 * - operational_status (required)
 * - notes (optional)
 */
router.patch(
    '/:id/status',
    auth,
    validate(waterSourceValidation.updateSourceStatus),
    waterSourceController.updateSourceStatus
);

/**
 * @route   PATCH /api/v1/water-sources/:id/contamination
 * @desc    Update contamination status of a water source
 * @access  Private (authenticated users)
 * 
 * Body:
 * - contamination_status (required): 'Clean', 'Contaminated', or 'Unknown'
 * - notes (optional)
 */
router.patch(
    '/:id/contamination',
    auth,
    validate(waterSourceValidation.updateContaminationStatus),
    waterSourceController.updateContaminationStatus
);

/**
 * @route   PATCH /api/v1/water-sources/:id/verify
 * @desc    Verify a water source
 * @access  Private (Moderator or Admin only)
 */
router.patch(
    '/:id/verify',
    auth,
    authorize('MODERATOR', 'ADMIN'),
    validate(waterSourceValidation.verifyWaterSource),
    waterSourceController.verifyWaterSource
);

/**
 * @route   DELETE /api/v1/water-sources/:id
 * @desc    Soft delete a water source
 * @access  Private (Creator, Moderator, or Admin)
 */
router.delete(
    '/:id',
    auth,
    validate(waterSourceValidation.deleteWaterSource),
    waterSourceController.softDeleteSource
);

module.exports = router;
