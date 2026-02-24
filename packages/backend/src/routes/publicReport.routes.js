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
 * @desc    Get in-progress reports by NIC number
 * @access  Public
 */
router.get('/by-nic/:nic', validate(nicParamSchema, 'params'), getByNic);

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

module.exports = router;
