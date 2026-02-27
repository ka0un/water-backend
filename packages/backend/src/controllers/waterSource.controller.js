// HTTP status codes used in this controller
const HTTP_STATUS = {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    FORBIDDEN: 403,
};
const WaterSource = require('../models/WaterSource.model');
const { WaterTest } = require('../models/WaterTest.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Create a new water source
 * @route   POST /api/v1/water-sources
 * @access  Private (authenticated users)
 *
 * NOTE: Includes duplicate detection within 20 meters to prevent duplicate entries
 */
const createSource = asyncHandler(async (req, res) => {
    const { name, type, location, operational_status, access_type, description } = req.body;
    const userId = req.user._id;

    // Extract coordinates from request
    const { latitude, longitude } = location;

    /**
     * DUPLICATE CHECK: Prevent submissions within 20 meters
     * Uses MongoDB's $near operator with 2dsphere index
     */
    const isDuplicate = await WaterSource.checkDuplicateNearby(longitude, latitude, 20);

    if (isDuplicate) {
        throw new ApiError(
            HTTP_STATUS.CONFLICT,
            'A water source already exists within 20 meters of this location. Please check existing sources before submitting.'
        );
    }

    /**
     * Create GeoJSON Point format for MongoDB geospatial indexing
     * MongoDB GeoJSON format requires: { type: "Point", coordinates: [longitude, latitude] }
     * Note: GeoJSON uses [longitude, latitude] order (NOT [lat, lng])
     */
    const waterSource = await WaterSource.create({
        name,
        type,
        location: {
            type: 'Point',
            coordinates: [longitude, latitude], // [lng, lat] order for GeoJSON
        },
        operational_status,
        access_type,
        description,
        created_by: userId,
    });

    // Populate creator information
    await waterSource.populate('created_by', 'name email');

    return ApiResponse.created(
        res,
        waterSource,
        'Water source created successfully'
    );
});

/**
 * @desc    Get all water sources with optional filters
 * @route   GET /api/v1/water-sources
 * @access  Public
 *
 * Query parameters:
 * - type: Filter by water source type (Well, Public Tap, etc.)
 * - operational_status: Filter by status (Functional, Broken, etc.)
 * - access_type: Filter by access type (Public, Private, Restricted)
 * - verified: Filter by verification status (true/false)
 * - page: Page number for pagination (default: 1)
 * - limit: Results per page (default: 10, max: 100)
 * - sort: Sort field (createdAt, -createdAt, name, -name)
 */
const getSources = asyncHandler(async (req, res) => {
    const {
        type,
        operational_status,
        access_type,
        verified,
        page = 1,
        limit = 10,
        sort = '-createdAt',
    } = req.query;

    // Build filter object - only include non-deleted sources
    const filter = { is_deleted: false };

    if (type) filter.type = type;
    if (operational_status) filter.operational_status = operational_status;
    if (access_type) filter.access_type = access_type;
    if (verified !== undefined) filter.verified = verified === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [sources, total] = await Promise.all([
        WaterSource.find(filter)
            .populate('created_by', 'name email')
            .populate('verified_by', 'name email')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip)
            .lean(),
        WaterSource.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
        sources,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    }, 'Water sources retrieved successfully');
});

/**
 * @desc    Get nearby water sources using geospatial query
 * @route   GET /api/v1/water-sources/nearby
 * @access  Public
 *
 * Query parameters:
 * - latitude: User's current latitude (required)
 * - longitude: User's current longitude (required)
 * - radius: Search radius in meters (default: 5000m = 5km, max: 50km)
 * - type: Optional type filter
 * - operational_status: Optional status filter
 *
 * GEOSPATIAL LOGIC:
 * - Uses MongoDB's $near operator with 2dsphere index
 * - $near automatically sorts results by distance (nearest first)
 * - $maxDistance defines the search radius in meters
 * - Requires a 2dsphere index on the location field (created in model)
 */
const getNearbySources = asyncHandler(async (req, res) => {
    const {
        latitude,
        longitude,
        radius = 5000,
        type,
        operational_status,
    } = req.query;

    // Build additional filters
    const filters = {};
    if (type) filters.type = type;
    if (operational_status) filters.operational_status = operational_status;

    /**
     * Use the static method defined in the model for geospatial query
     * This uses $near operator which:
     * 1. Finds documents where location is within the specified radius
     * 2. Automatically sorts results by distance (nearest first)
     * 3. Returns distance in meters
     */
    const sources = await WaterSource.findNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(radius),
        filters
    );

    return ApiResponse.success(res, {
        sources,
        count: sources.length,
        center: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        },
        radius: parseInt(radius),
    }, `Found ${sources.length} water source(s) within ${radius}m`);
});

/**
 * @desc    Get a single water source by ID
 * @route   GET /api/v1/water-sources/:id
 * @access  Public
 *
 * Returns detailed information including:
 * - Water source details
 * - Creator information
 * - Verifier information (if verified)
 * - Recent contamination reports (placeholder for future integration)
 */
const getSourceById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const waterSource = await WaterSource.findOne({
        _id: id,
        is_deleted: false,
    })
        .populate('created_by', 'name email createdAt')
        .populate('verified_by', 'name email')
        .lean();

    if (!waterSource) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Water source not found');
    }

    /**
     * PLACEHOLDER: Fetch recent contamination reports for this water source
     * This will be populated when integrating with WaterTest model
     * Query will look for water tests linked to this source location
     */
    const recentReports = await WaterTest.find({
        // TODO: Add geospatial query or source_id reference when WaterTest model is updated
        // For now, returning empty array as placeholder
    })
        .limit(5)
        .sort('-createdAt')
        .lean();

    return ApiResponse.success(res, {
        ...waterSource,
        recentReports: recentReports || [],
    }, 'Water source retrieved successfully');
});

/**
 * @desc    Update operational status of a water source
 * @route   PATCH /api/v1/water-sources/:id/status
 * @access  Private (Admin or Verified Users)
 *
 * Allows authorized users to update the operational status
 * Example: Marking a well as "Broken" or "Maintenance"
 */
const updateSourceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { operational_status, notes } = req.body;
    const userId = req.user._id;

    const waterSource = await WaterSource.findOne({
        _id: id,
        is_deleted: false,
    });

    if (!waterSource) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Water source not found');
    }

    // Update the operational status
    const previousStatus = waterSource.operational_status;
    waterSource.operational_status = operational_status;

    // If notes provided, append to description with timestamp
    if (notes) {
        const statusUpdate = `\n[${new Date().toISOString()}] Status changed from "${previousStatus}" to "${operational_status}" by user ${userId}: ${notes}`;
        waterSource.description = (waterSource.description || '') + statusUpdate;
    }

    await waterSource.save();
    await waterSource.populate('created_by', 'name email');

    return ApiResponse.success(
        res,
        waterSource,
        `Operational status updated from "${previousStatus}" to "${operational_status}"`
    );
});

/**
 * @desc    Update water source details
 * @route   PATCH /api/v1/water-sources/:id
 * @access  Private (Creator, Moderator, or Admin)
 */
const updateWaterSource = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const waterSource = await WaterSource.findOne({
        _id: id,
        is_deleted: false,
    });

    if (!waterSource) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Water source not found');
    }

    // Check permissions: only creator, moderator, or admin can update
    const isCreator = waterSource.created_by.toString() === userId.toString();
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    if (!isCreator && !isModerator) {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            'You do not have permission to update this water source'
        );
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'type', 'operational_status', 'access_type', 'description'];
    Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            waterSource[key] = updateData[key];
        }
    });

    await waterSource.save();
    await waterSource.populate('created_by', 'name email');

    return ApiResponse.success(
        res,
        waterSource,
        'Water source updated successfully'
    );
});

/**
 * @desc    Verify a water source (Moderator/Admin only)
 * @route   PATCH /api/v1/water-sources/:id/verify
 * @access  Private (Moderator or Admin)
 *
 * Marks a water source as verified by a moderator/admin
 */
const verifyWaterSource = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const waterSource = await WaterSource.findOne({
        _id: id,
        is_deleted: false,
    });

    if (!waterSource) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Water source not found');
    }

    if (waterSource.verified) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Water source is already verified'
        );
    }

    waterSource.verified = true;
    waterSource.verified_by = userId;
    waterSource.verified_at = new Date();

    await waterSource.save();
    await waterSource.populate('created_by', 'name email');
    await waterSource.populate('verified_by', 'name email');

    return ApiResponse.success(
        res,
        waterSource,
        'Water source verified successfully'
    );
});

/**
 * @desc    Soft delete a water source
 * @route   DELETE /api/v1/water-sources/:id
 * @access  Private (Creator, Moderator, or Admin)
 *
 * SOFT DELETE: Marks is_deleted = true instead of removing from database
 * This preserves historical data and maintains referential integrity
 */
const softDeleteSource = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const waterSource = await WaterSource.findOne({
        _id: id,
        is_deleted: false,
    });

    if (!waterSource) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Water source not found');
    }

    // Check permissions: only creator, moderator, or admin can delete
    const isCreator = waterSource.created_by.toString() === userId.toString();
    const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';

    if (!isCreator && !isModerator) {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            'You do not have permission to delete this water source'
        );
    }

    // Use the instance method for soft delete
    await waterSource.softDelete(userId);

    return ApiResponse.success(
        res,
        { id: waterSource._id },
        'Water source deleted successfully'
    );
});

/**
 * @desc    Get water source statistics
 * @route   GET /api/v1/water-sources/stats
 * @access  Public
 *
 * Provides aggregate statistics about water sources
 */
const getSourceStats = asyncHandler(async (req, res) => {
    const stats = await WaterSource.aggregate([
        // Only count non-deleted sources
        { $match: { is_deleted: false } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                verified: {
                    $sum: { $cond: [{ $eq: ['$verified', true] }, 1, 0] },
                },
                byType: {
                    $push: '$type',
                },
                byStatus: {
                    $push: '$operational_status',
                },
                byAccessType: {
                    $push: '$access_type',
                },
            },
        },
    ]);

    if (!stats.length) {
        return ApiResponse.success(res, {
            total: 0,
            verified: 0,
            byType: {},
            byStatus: {},
            byAccessType: {},
        }, 'No water sources found');
    }

    // Count occurrences for each category
    const countOccurrences = (arr) => {
        return arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    };

    const result = {
        total: stats[0].total,
        verified: stats[0].verified,
        unverified: stats[0].total - stats[0].verified,
        byType: countOccurrences(stats[0].byType),
        byStatus: countOccurrences(stats[0].byStatus),
        byAccessType: countOccurrences(stats[0].byAccessType),
    };

    return ApiResponse.success(res, result, 'Statistics retrieved successfully');
});

module.exports = {
    createSource,
    getSources,
    getNearbySources,
    getSourceById,
    updateSourceStatus,
    updateWaterSource,
    verifyWaterSource,
    softDeleteSource,
    getSourceStats,
};
