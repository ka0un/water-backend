const { ModerationLog, ModerationAction } = require('../models/ModerationLog.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get moderation logs with basic filtering.
 * Query params: page, limit, action, moderatorId, reportId
 */
exports.getModerationLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        action,
        moderatorId,
        reportId,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};

    if (action && Object.values(ModerationAction).includes(action)) {
        filter.action = action;
    }
    if (moderatorId) {
        filter.moderatorId = moderatorId;
    }
    if (reportId) {
        filter.reportId = reportId;
    }

    const [items, total] = await Promise.all([
        ModerationLog.find(filter)
            .sort({ timestamp: -1 })
            .skip((pageNum - 1) * pageSize)
            .limit(pageSize)
            .populate('moderatorId', 'name email role')
            .populate('targetUserId', 'name email role'),
        ModerationLog.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, 'Moderation logs retrieved successfully', {
            logs: items,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize),
            },
        })
    );
});



