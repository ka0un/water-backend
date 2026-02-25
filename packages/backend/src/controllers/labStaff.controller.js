const { LabTestRequest, LabTestStatus, SAFE_LIMITS } = require('../models/LabTestRequest.model');
const { PublicReport } = require('../models/PublicReport.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// ─── Get Lab Staff Dashboard Stats ───────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        pendingCount,
        acceptedCount,
        inProgressCount,
        completedTodayCount,
        totalCompletedCount,
        recentRequests,
    ] = await Promise.all([
        LabTestRequest.countDocuments({ status: LabTestStatus.PENDING_ACCEPTANCE, deletedAt: null }),
        LabTestRequest.countDocuments({ 
            status: { $in: [LabTestStatus.ACCEPTED, LabTestStatus.SAMPLE_SCHEDULED] }, 
            deletedAt: null 
        }),
        LabTestRequest.countDocuments({ 
            status: { $in: [LabTestStatus.SAMPLE_COLLECTED, LabTestStatus.TESTING_IN_PROGRESS] }, 
            deletedAt: null 
        }),
        LabTestRequest.countDocuments({
            status: LabTestStatus.COMPLETED,
            'testing.completedAt': {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            deletedAt: null,
        }),
        LabTestRequest.countDocuments({ status: LabTestStatus.COMPLETED, deletedAt: null }),
        LabTestRequest.find({ deletedAt: null })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('publicReport', 'waterSource location nic')
            .select('requestNumber status priority createdAt scheduledCollection'),
    ]);

    return ApiResponse.success(res, {
        stats: {
            pendingAcceptance: pendingCount,
            accepted: acceptedCount,
            inProgress: inProgressCount,
            completedToday: completedTodayCount,
            totalCompleted: totalCompletedCount,
        },
        recentRequests,
    }, 'Dashboard stats retrieved successfully');
});

// ─── List All Lab Test Requests ──────────────────────────────────
const listRequests = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        priority,
        sort = '-createdAt',
    } = req.query;

    const filter = { deletedAt: null };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
        LabTestRequest.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('publicReport', 'waterSource location nic createdAt')
            .populate('acceptedBy', 'name email')
            .populate('scheduledCollection.assignedCollector', 'name'),
        LabTestRequest.countDocuments(filter),
    ]);

    return ApiResponse.success(res, {
        requests,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
    }, 'Lab test requests retrieved successfully');
});

// ─── Get Single Lab Test Request ─────────────────────────────────
const getRequest = asyncHandler(async (req, res) => {
    const request = await LabTestRequest.findById(req.params.id)
        .populate('publicReport')
        .populate('acceptedBy', 'name email')
        .populate('rejectedBy', 'name email')
        .populate('scheduledCollection.assignedCollector', 'name email')
        .populate('sampleCollection.collectedBy', 'name email')
        .populate('testing.testedBy', 'name email')
        .populate('verdict.issuedBy', 'name email')
        .populate('createdBy', 'name email');

    if (!request) throw ApiError.notFound('Lab test request not found');

    return ApiResponse.success(res, { request }, 'Lab test request retrieved successfully');
});

// ─── Accept a Lab Test Request ───────────────────────────────────
const acceptRequest = asyncHandler(async (req, res) => {
    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (request.status !== LabTestStatus.PENDING_ACCEPTANCE) {
        throw ApiError.badRequest('Request has already been processed');
    }

    request.status = LabTestStatus.ACCEPTED;
    request.acceptedBy = req.user._id;
    request.acceptedAt = new Date();

    await request.save();

    return ApiResponse.success(res, { request }, 'Lab test request accepted successfully');
});

// ─── Reject a Lab Test Request ───────────────────────────────────
const rejectRequest = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason) throw ApiError.badRequest('Rejection reason is required');

    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (request.status !== LabTestStatus.PENDING_ACCEPTANCE) {
        throw ApiError.badRequest('Request has already been processed');
    }

    request.status = LabTestStatus.REJECTED;
    request.rejectedBy = req.user._id;
    request.rejectedAt = new Date();
    request.rejectionReason = reason;

    await request.save();

    return ApiResponse.success(res, { request }, 'Lab test request rejected');
});

// ─── Schedule Sample Collection ──────────────────────────────────
const scheduleCollection = asyncHandler(async (req, res) => {
    const { date, timeSlot, assignedCollector, contactPhone, specialInstructions } = req.body;

    if (!date || !timeSlot) {
        throw ApiError.badRequest('Collection date and time slot are required');
    }

    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (![LabTestStatus.ACCEPTED, LabTestStatus.SAMPLE_SCHEDULED].includes(request.status)) {
        throw ApiError.badRequest('Request must be accepted before scheduling');
    }

    request.scheduledCollection = {
        date: new Date(date),
        timeSlot,
        assignedCollector: assignedCollector || req.user._id,
        contactPhone,
        specialInstructions,
    };
    request.status = LabTestStatus.SAMPLE_SCHEDULED;

    await request.save();

    return ApiResponse.success(res, { request }, 'Sample collection scheduled successfully');
});

// ─── Record Sample Collection ────────────────────────────────────
const recordSampleCollection = asyncHandler(async (req, res) => {
    const {
        lat, lng, accuracy, address,
        sampleId, bottleType, volumeCollected,
        waterTemperature, weatherConditions, notes, photos,
    } = req.body;

    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (request.status !== LabTestStatus.SAMPLE_SCHEDULED) {
        throw ApiError.badRequest('Sample collection must be scheduled first');
    }

    request.sampleCollection = {
        collectedBy: req.user._id,
        collectedAt: new Date(),
        location: { lat, lng, accuracy, address },
        sampleId: sampleId || `SMP-${Date.now()}`,
        bottleType,
        volumeCollected,
        waterTemperature,
        weatherConditions,
        photos: photos || [],
        notes,
    };
    request.status = LabTestStatus.SAMPLE_COLLECTED;

    await request.save();

    return ApiResponse.success(res, { request }, 'Sample collection recorded successfully');
});

// ─── Start Testing ───────────────────────────────────────────────
const startTesting = asyncHandler(async (req, res) => {
    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (request.status !== LabTestStatus.SAMPLE_COLLECTED) {
        throw ApiError.badRequest('Sample must be collected before testing can begin');
    }

    request.testing.startedAt = new Date();
    request.testing.testedBy = req.user._id;
    request.status = LabTestStatus.TESTING_IN_PROGRESS;

    await request.save();

    return ApiResponse.success(res, { request }, 'Testing started');
});

// ─── Input Test Results ──────────────────────────────────────────
const inputTestResults = asyncHandler(async (req, res) => {
    const { results, labNotes } = req.body;

    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (request.status !== LabTestStatus.TESTING_IN_PROGRESS) {
        throw ApiError.badRequest('Testing must be in progress to input results');
    }

    // Update results
    if (results) {
        for (const [param, data] of Object.entries(results)) {
            if (request.results[param] !== undefined) {
                request.results[param] = {
                    value: data.value,
                    unit: data.unit || SAFE_LIMITS[param]?.unit,
                    testedAt: new Date(),
                    notes: data.notes,
                };
            }
        }
        request.markModified('results');
    }

    if (labNotes) {
        request.testing.labNotes = labNotes;
    }

    await request.save();

    return ApiResponse.success(res, { request }, 'Test results updated');
});

// ─── Complete Testing & Issue Verdict ────────────────────────────
const completeTestingAndIssueVerdict = asyncHandler(async (req, res) => {
    const { recommendations } = req.body;

    const request = await LabTestRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound('Lab test request not found');

    if (request.status !== LabTestStatus.TESTING_IN_PROGRESS) {
        throw ApiError.badRequest('Testing must be in progress to complete');
    }

    // Calculate verdict based on results
    request.calculateVerdict();

    // Add custom recommendations if provided
    if (recommendations && Array.isArray(recommendations)) {
        request.verdict.recommendations = recommendations;
    } else {
        // Auto-generate recommendations based on verdict
        request.verdict.recommendations = generateRecommendations(request.verdict);
    }

    request.verdict.issuedAt = new Date();
    request.verdict.issuedBy = req.user._id;
    request.testing.completedAt = new Date();
    request.status = LabTestStatus.COMPLETED;

    // Generate report number
    const date = new Date();
    const reportNum = `RPT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${request.requestNumber.split('-').pop()}`;
    request.finalReport = {
        generatedAt: new Date(),
        reportNumber: reportNum,
    };

    await request.save();

    return ApiResponse.success(res, { request }, 'Testing completed and verdict issued');
});

// Helper function to generate recommendations
function generateRecommendations(verdict) {
    const recommendations = [];

    if (verdict.result === 'safe') {
        recommendations.push('Water is safe for drinking and domestic use.');
        recommendations.push('Continue regular monitoring every 6 months.');
    } else if (verdict.result === 'unsafe') {
        recommendations.push('DO NOT consume this water - immediate health risk.');
        recommendations.push('Notify local health authorities immediately.');
        
        if (verdict.failedParameters.includes('lead')) {
            recommendations.push('Lead contamination detected - check for corroded pipes.');
        }
        if (verdict.failedParameters.includes('arsenic')) {
            recommendations.push('Arsenic detected - avoid all contact with water.');
        }
        if (verdict.failedParameters.includes('coliformBacteria') || verdict.failedParameters.includes('ecoliCount')) {
            recommendations.push('Bacterial contamination - boiling will NOT make it safe.');
            recommendations.push('Professional water treatment required.');
        }
    } else {
        recommendations.push('Water requires treatment before consumption.');
        recommendations.push('Consider installing appropriate filtration system.');
        recommendations.push('Retest after treatment is implemented.');
    }

    return recommendations;
}

// ─── Get Safe Limits Reference ───────────────────────────────────
const getSafeLimits = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, { safeLimits: SAFE_LIMITS }, 'Safe limits retrieved');
});

module.exports = {
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
};
