const { PublicReport } = require('../models/PublicReport.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// ─── List all reports (with pagination, filtering, sorting) ──────
const listReports = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        status,         // pending | approved | rejected
        nic,
        waterSource,
        district,
        completed,      // true | false
        dateFrom,
        dateTo,
    } = req.query;

    const filter = {};

    if (status) filter.mod_status = status;
    if (nic) filter.nic = { $regex: nic, $options: 'i' };
    if (waterSource) filter.waterSource = waterSource;
    if (district) filter['location.district'] = { $regex: district, $options: 'i' };
    if (completed !== undefined) filter.wizardCompleted = completed === 'true';
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
        PublicReport.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select('-images.data -advancedTests'),
        PublicReport.countDocuments(filter),
    ]);

    return ApiResponse.success(res, {
        reports,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
    }, 'Reports retrieved successfully');
});

// ─── Get report statistics ───────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
    const baseMatch = { wizardCompleted: true, deletedAt: null };

    const [
        statusCounts, sourceCounts, districtCounts, dailyCounts, totalImages,
        testingMethods, observationFreqs, mapPoints, weeklyTrend,
        turbidityLevels, appearanceDist, hourlyPattern, photoStats, waterFlowDist,
    ] = await Promise.all([
        // By moderation status
        PublicReport.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$mod_status', count: { $sum: 1 } } },
        ]),
        // By water source
        PublicReport.aggregate([
            { $match: { ...baseMatch, waterSource: { $ne: null } } },
            { $group: { _id: '$waterSource', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        // By district
        PublicReport.aggregate([
            { $match: { ...baseMatch, 'location.district': { $ne: null } } },
            { $group: { _id: '$location.district', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 25 },
        ]),
        // Daily submissions (last 30 days)
        PublicReport.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }, deletedAt: null } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
        // Total images
        PublicReport.aggregate([
            { $match: { deletedAt: null } },
            { $project: { imageCount: { $size: { $ifNull: ['$images', []] } } } },
            { $group: { _id: null, total: { $sum: '$imageCount' } } },
        ]),
        // Testing method breakdown
        PublicReport.aggregate([
            { $match: { ...baseMatch, testingMethod: { $ne: null } } },
            { $group: { _id: '$testingMethod', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        // Observation frequency
        PublicReport.aggregate([
            { $match: baseMatch },
            {
                $project: {
                    issues: {
                        $filter: {
                            input: [
                                { k: 'Smell', v: '$smell.detected' },
                                { k: 'Taste', v: '$taste.detected' },
                                { k: 'Sediment', v: '$sediment.detected' },
                                { k: 'Oil/Grease', v: '$oilGrease.detected' },
                                { k: 'Foam', v: '$foamBubbles.detected' },
                                { k: 'Algae', v: '$algae.detected' },
                                { k: 'Trash', v: '$trashDebris.detected' },
                                { k: 'Mud/Silt', v: '$mudSilt.detected' },
                                { k: 'Insects', v: '$insectsLarvae.detected' },
                                { k: 'Plants', v: '$plantMatter.detected' },
                                { k: 'Wildlife', v: '$deadWildlife.detected' },
                                { k: 'Pipe Issues', v: '$pipeCondition.detected' },
                            ],
                            as: 'item',
                            cond: { $eq: ['$$item.v', true] },
                        },
                    },
                }
            },
            { $unwind: '$issues' },
            { $group: { _id: '$issues.k', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        // Map markers
        PublicReport.aggregate([
            { $match: { ...baseMatch, 'location.coordinates.lat': { $ne: null }, 'location.coordinates.lng': { $ne: null } } },
            {
                $project: {
                    lat: '$location.coordinates.lat', lng: '$location.coordinates.lng',
                    waterSource: 1, mod_status: 1, district: '$location.district',
                }
            },
            { $limit: 200 },
        ]),
        // Weekly trend (last 12 weeks)
        PublicReport.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 84 * 86400000) }, deletedAt: null } },
            { $group: { _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
        // ── NEW: Turbidity level distribution ──
        PublicReport.aggregate([
            { $match: { ...baseMatch, 'turbidity.value': { $ne: null } } },
            { $group: { _id: '$turbidity.value', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        // ── NEW: Water appearance distribution ──
        PublicReport.aggregate([
            { $match: { ...baseMatch, 'appearance.value': { $ne: null } } },
            { $group: { _id: '$appearance.value', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        // ── NEW: Hourly submission pattern (hour of day) ──
        PublicReport.aggregate([
            { $match: { ...baseMatch } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } },
        ]),
        // ── NEW: Photo coverage (with vs without photos) ──
        PublicReport.aggregate([
            { $match: baseMatch },
            { $project: { hasPhoto: { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] } } },
            { $group: { _id: '$hasPhoto', count: { $sum: 1 } } },
        ]),
        // ── NEW: Water flow distribution ──
        PublicReport.aggregate([
            { $match: { ...baseMatch, waterFlow: { $ne: null } } },
            { $group: { _id: '$waterFlow', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
    ]);

    const total = await PublicReport.countDocuments();
    const completed = await PublicReport.countDocuments({ wizardCompleted: true });
    const inProgress = await PublicReport.countDocuments({ wizardCompleted: false });

    return ApiResponse.success(res, {
        overview: { total, completed, inProgress },
        byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        bySource: sourceCounts,
        byDistrict: districtCounts,
        dailySubmissions: dailyCounts,
        totalImages: totalImages[0]?.total || 0,
        testingMethods,
        observationFreqs,
        mapPoints,
        weeklyTrend,
        turbidityLevels,
        appearanceDist,
        hourlyPattern,
        photoStats,
        waterFlowDist,
    }, 'Statistics retrieved successfully');
});


// ─── Get single report (full, with image metadata) ───────────────
const getReportDetail = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);
    if (!report) throw ApiError.notFound('Report not found');

    const reportObj = report.toObject();
    // Strip image binary data, keep metadata
    if (reportObj.images) {
        reportObj.images = reportObj.images.map(img => ({
            _id: img._id,
            imageType: img.imageType,
            contentType: img.contentType,
            filename: img.filename,
            uploadedAt: img.uploadedAt,
        }));
    }

    return ApiResponse.success(res, { report: reportObj }, 'Report retrieved');
});

// ─── Get a specific image by ID ──────────────────────────────────
const getImage = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);
    if (!report) throw ApiError.notFound('Report not found');

    const image = report.images.id(req.params.imageId);
    if (!image) throw ApiError.notFound('Image not found');

    const buffer = Buffer.from(image.data, 'base64');
    res.set('Content-Type', image.contentType);
    res.set('Content-Length', buffer.length);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
});

// ─── Moderate a report (approve / reject) ────────────────────────
const moderateReport = asyncHandler(async (req, res) => {
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
        throw ApiError.badRequest('Action must be "approve" or "reject"');
    }

    const report = await PublicReport.findById(req.params.id);
    if (!report) throw ApiError.notFound('Report not found');

    if (!report.wizardCompleted) {
        throw ApiError.badRequest('Cannot moderate an incomplete report');
    }

    report.moderator_id = req.user._id;

    if (action === 'approve') {
        report.mod_status = 'approved';
        report.approved_at = new Date();
        report.rejected_at = null;
        report.rejection_reason = null;
    } else {
        if (!reason) throw ApiError.badRequest('Rejection reason is required');
        report.mod_status = 'rejected';
        report.rejected_at = new Date();
        report.rejection_reason = reason;
        report.approved_at = null;
    }

    await report.save();

    return ApiResponse.success(res, { report }, `Report ${action}d successfully`);
});

// ─── Update any field on a report (admin override) ───────────────
const adminUpdateReport = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);
    if (!report) throw ApiError.notFound('Report not found');

    const updates = req.body;
    const immutableFields = ['_id', 'nic', 'createdAt', 'updatedAt', '__v'];

    for (const [key, value] of Object.entries(updates)) {
        if (immutableFields.includes(key)) continue;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            report[key] = { ...report[key]?.toObject?.() || report[key] || {}, ...value };
            report.markModified(key);
        } else {
            report[key] = value;
        }
    }

    await report.save();
    return ApiResponse.success(res, { report }, 'Report updated by admin');
});

// ─── Soft delete a single report ───────────────────────────────
const deleteReport = asyncHandler(async (req, res) => {
    const report = await PublicReport.findById(req.params.id);
    if (!report) throw ApiError.notFound('Report not found');
    report.deletedAt = new Date();
    await report.save();
    return ApiResponse.success(res, { id: req.params.id, deletedAt: report.deletedAt }, 'Report soft-deleted successfully');
});

// ─── Soft delete all reports for a NIC ────────────────────────
const deleteByNic = asyncHandler(async (req, res) => {
    const { nic } = req.params;
    const result = await PublicReport.updateMany(
        { nic, deletedAt: null },
        { $set: { deletedAt: new Date() } }
    );
    return ApiResponse.success(res, {
        nic,
        deletedCount: result.modifiedCount,
    }, `Soft-deleted ${result.modifiedCount} reports for NIC ${nic}`);
});

// ─── Soft-delete all reports (dev only) ────────────────────────
const resetAll = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        throw ApiError.forbidden('Reset is not available in production');
    }
    const result = await PublicReport.updateMany(
        { deletedAt: null },
        { $set: { deletedAt: new Date() } }
    );
    return ApiResponse.success(res, {
        deletedCount: result.modifiedCount,
    }, `Soft-deleted ${result.modifiedCount} reports`);
});

// ─── Export reports as JSON ──────────────────────────────────────
const exportReports = asyncHandler(async (req, res) => {
    const { status, waterSource, dateFrom, dateTo } = req.query;
    const filter = { wizardCompleted: true };

    if (status) filter.mod_status = status;
    if (waterSource) filter.waterSource = waterSource;
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const reports = await PublicReport.find(filter)
        .sort('-createdAt')
        .select('-images.data')
        .lean();

    res.set('Content-Type', 'application/json');
    res.set('Content-Disposition', `attachment; filename=reports_export_${Date.now()}.json`);
    return res.json({ exportedAt: new Date(), count: reports.length, reports });
});

module.exports = {
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
};
