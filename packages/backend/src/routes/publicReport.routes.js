const express = require('express');
const validate = require('../middlewares/validate.middleware');
const {
    createReportSchema,
    updateReportSchema,
    nicParamSchema,
} = require('../validations/publicReport.validation');
const {
    createReport,
    getReport,
    updateReport,
    getByNic,
    submitReport,
    uploadImages,
    getReportFull,
} = require('../controllers/publicReport.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/public-reports
 * @desc    Create a new public report (wizard start)
 * @access  Public
 */
router.post('/', validate(createReportSchema), createReport);

/**
 * @route   GET /api/v1/public-reports/by-nic/:nic
 * @desc    Get reports by NIC number (in-progress + completed)
 * @access  Public
 */
router.get('/by-nic/:nic', validate(nicParamSchema, 'params'), getByNic);

/**
 * @route   GET /api/v1/public-reports/:id/full
 * @desc    Get a full report (with image metadata, for viewing past submissions)
 * @access  Public
 */
router.get('/:id/full', getReportFull);

/**
 * @route   GET /api/v1/public-reports/:id
 * @desc    Get a report by ID
 * @access  Public
 */
router.get('/:id', getReport);

/**
 * @route   PATCH /api/v1/public-reports/:id
 * @desc    Update report (auto-save wizard step)
 * @access  Public
 */
router.patch('/:id', validate(updateReportSchema), updateReport);

/**
 * @route   POST /api/v1/public-reports/:id/submit
 * @desc    Submit the report (mark wizard completed)
 * @access  Public
 */
router.post('/:id/submit', submitReport);

/**
 * @route   POST /api/v1/public-reports/:id/images
 * @desc    Upload images for a report (base64)
 * @access  Public
 */
router.post('/:id/images', uploadImages);

module.exports = router;
