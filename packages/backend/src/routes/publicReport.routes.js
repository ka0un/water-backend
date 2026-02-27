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
 * @swagger
 * /public-reports:
 *   post:
 *     summary: Create a new public report
 *     tags: [Public Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', validate(createReportSchema), createReport);

/**
 * @swagger
 * /public-reports/by-nic/{nic}:
 *   get:
 *     summary: Get reports by NIC
 *     tags: [Public Reports]
 *     parameters:
 *       - in: path
 *         name: nic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returned list of reports
 */
router.get('/by-nic/:nic', validate(nicParamSchema, 'params'), getByNic);

/**
 * @swagger
 * /public-reports/{id}/full:
 *   get:
 *     summary: Get full report
 *     tags: [Public Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full report data
 */
router.get('/:id/full', getReportFull);

/**
 * @swagger
 * /public-reports/{id}:
 *   get:
 *     summary: Get a report by ID
 *     tags: [Public Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report data
 */
router.get('/:id', getReport);

/**
 * @swagger
 * /public-reports/{id}:
 *   patch:
 *     summary: Update report (Auto-save)
 *     tags: [Public Reports]
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
 *         description: Successfully saved
 */
router.patch('/:id', validate(updateReportSchema), updateReport);

/**
 * @swagger
 * /public-reports/{id}/submit:
 *   post:
 *     summary: Submit the report
 *     tags: [Public Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submitted
 */
router.post('/:id/submit', submitReport);

/**
 * @swagger
 * /public-reports/{id}/images:
 *   post:
 *     summary: Upload images
 *     tags: [Public Reports]
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
 *         description: Images uploaded
 */
router.post('/:id/images', uploadImages);

module.exports = router;
