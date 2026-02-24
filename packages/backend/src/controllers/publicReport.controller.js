const { PublicReport } = require('../models/PublicReport.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Create a new public report (wizard start)
 * @route   POST /api/v1/public-reports
 * @access  Public
 */
const createReport = asyncHandler(async (req, res) => {
    const { nic } = req.body;

    const report = await PublicReport.create({
        nic,
        currentStep: 1,
    });

    return ApiResponse.created(res, { report }, 'Report created successfully');
});

/**
 * @desc    Get a report by ID
 * @route   GET /api/v1/public-reports/:id
 * @access  Public
 */
const getReport = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);

    if (!report) {
        throw ApiError.notFound('Report not found');
    }

    return ApiResponse.success(res, { report }, 'Report retrieved successfully');
});

/**
 * @desc    Update a report (auto-save wizard step)
 * @route   PATCH /api/v1/public-reports/:id
 * @access  Public
 */
const updateReport = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);

    if (!report) {
        throw ApiError.notFound('Report not found');
    }

    if (report.wizardCompleted) {
        throw ApiError.badRequest('Cannot update a completed report');
    }

    // Deep merge the updates
    const allowedFields = [
        'waterSource', 'waterSourceOther', 'location',
        'appearance', 'smell', 'taste', 'turbidity', 'sediment',
        'oilGrease', 'foamBubbles', 'algae', 'trashDebris',
        'mudSilt', 'insectsLarvae', 'plantMatter', 'deadWildlife',
        'pipeCondition', 'waterFlow', 'temperature',
        'testingMethod', 'advancedTests', 'currentStep',
        'email', 'phone',
    ];

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            if (typeof req.body[field] === 'object' && req.body[field] !== null && !Array.isArray(req.body[field])) {
                // Merge nested objects instead of replacing entirely
                report[field] = { ...report[field]?.toObject?.() || report[field] || {}, ...req.body[field] };
            } else {
                report[field] = req.body[field];
            }
        }
    }

    report.markModified('location');
    report.markModified('appearance');
    report.markModified('smell');
    report.markModified('taste');
    report.markModified('turbidity');
    report.markModified('sediment');
    report.markModified('oilGrease');
    report.markModified('foamBubbles');
    report.markModified('algae');
    report.markModified('trashDebris');
    report.markModified('mudSilt');
    report.markModified('insectsLarvae');
    report.markModified('plantMatter');
    report.markModified('deadWildlife');
    report.markModified('pipeCondition');
    report.markModified('advancedTests');

    await report.save();

    return ApiResponse.success(res, { report }, 'Report updated successfully');
});

/**
 * @desc    Get in-progress reports by NIC
 * @route   GET /api/v1/public-reports/by-nic/:nic
 * @access  Public
 */
const getByNic = asyncHandler(async (req, res) => {
    const { nic } = req.params;

    const reports = await PublicReport.find({ nic })
        .sort({ updatedAt: -1 })
        .select('_id nic waterSource currentStep wizardCompleted mod_status createdAt updatedAt completedAt');

    return ApiResponse.success(res, { reports }, 'Reports retrieved successfully');
});

/**
 * @desc    Upload images for a report
 * @route   POST /api/v1/public-reports/:id/images
 * @access  Public
 */
const uploadImages = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);

    if (!report) {
        throw ApiError.notFound('Report not found');
    }

    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
        throw ApiError.badRequest('Please provide at least one image');
    }

    // Limit total images per report
    const currentCount = report.images ? report.images.length : 0;
    if (currentCount + images.length > 10) {
        throw ApiError.badRequest('Maximum 10 images per report');
    }

    for (const img of images) {
        if (!img.data || !img.contentType || !img.imageType) {
            throw ApiError.badRequest('Each image must have data, contentType, and imageType');
        }

        // ~5MB limit per image (base64 inflates ~33%)
        if (img.data.length > 7 * 1024 * 1024) {
            throw ApiError.badRequest('Each image must be under 5MB');
        }

        report.images.push({
            imageType: img.imageType,
            data: img.data,
            contentType: img.contentType,
            filename: img.filename || null,
        });
    }

    await report.save();

    // Return count only, not the actual base64 data
    return ApiResponse.success(res, {
        imageCount: report.images.length,
    }, 'Images uploaded successfully');
});

/**
 * @desc    Get a completed report with full data (for viewing past submissions)
 * @route   GET /api/v1/public-reports/:id/full
 * @access  Public
 */
const getReportFull = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);

    if (!report) {
        throw ApiError.notFound('Report not found');
    }

    // Return images without actual data, just metadata
    const reportObj = report.toObject();
    if (reportObj.images) {
        reportObj.images = reportObj.images.map(img => ({
            _id: img._id,
            imageType: img.imageType,
            contentType: img.contentType,
            filename: img.filename,
            uploadedAt: img.uploadedAt,
        }));
    }

    return ApiResponse.success(res, { report: reportObj }, 'Report retrieved successfully');
});

/**
 * @desc    Submit a report (mark wizard as complete)
 * @route   POST /api/v1/public-reports/:id/submit
 * @access  Public
 */
const submitReport = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);

    if (!report) {
        throw ApiError.notFound('Report not found');
    }

    if (report.wizardCompleted) {
        throw ApiError.badRequest('Report has already been submitted');
    }

    report.wizardCompleted = true;
    report.completedAt = new Date();
    report.mod_status = 'pending';

    await report.save();

    return ApiResponse.success(res, { report }, 'Report submitted successfully');
});

module.exports = {
    createReport,
    getReport,
    updateReport,
    getByNic,
    submitReport,
    uploadImages,
    getReportFull,
};
