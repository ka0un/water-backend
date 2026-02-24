const mongoose = require('mongoose');

/**
 * Water source type enum
 */
const WaterSourceType = {
    WELL: 'Well',
    PUBLIC_TAP: 'Public Tap',
    RIVER: 'River',
    LAKE: 'Lake',
    BOWSER_POINT: 'Bowser Point',
};

/**
 * Operational status enum
 */
const OperationalStatus = {
    FUNCTIONAL: 'Functional',
    BROKEN: 'Broken',
    MAINTENANCE: 'Maintenance',
    ABANDONED: 'Abandoned',
};

/**
 * Access type enum
 */
const AccessType = {
    PUBLIC: 'Public',
    PRIVATE: 'Private',
    RESTRICTED: 'Restricted',
};

const waterSourceSchema = new mongoose.Schema(
    {
        /**
         * Display name of the water source
         * Example: "Community Well #4", "Main Street Public Tap"
         */
        name: {
            type: String,
            required: [true, 'Water source name is required'],
            trim: true,
            minlength: [3, 'Name must be at least 3 characters'],
            maxlength: [200, 'Name cannot exceed 200 characters'],
        },

        /**
         * Type of water source
         */
        type: {
            type: String,
            enum: Object.values(WaterSourceType),
            required: [true, 'Water source type is required'],
            index: true,
        },

        /**
         * GeoJSON Point for geospatial queries
         * MongoDB supports 2dsphere indexes for geospatial operations
         * Format: { type: "Point", coordinates: [longitude, latitude] }
         * Note: GeoJSON uses [longitude, latitude] order (NOT [lat, lng])
         */
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: [true, 'Coordinates are required'],
                validate: {
                    validator: function (coords) {
                        // Validate [longitude, latitude] format
                        return (
                            coords.length === 2 &&
                            coords[0] >= -180 &&
                            coords[0] <= 180 && // longitude
                            coords[1] >= -90 &&
                            coords[1] <= 90 // latitude
                        );
                    },
                    message:
                        'Invalid coordinates. Format: [longitude, latitude] where longitude is -180 to 180 and latitude is -90 to 90',
                },
            },
        },

        /**
         * Current operational status of the water source
         */
        operational_status: {
            type: String,
            enum: Object.values(OperationalStatus),
            default: OperationalStatus.FUNCTIONAL,
            index: true,
        },

        /**
         * Access type for the water source
         */
        access_type: {
            type: String,
            enum: Object.values(AccessType),
            default: AccessType.PUBLIC,
            index: true,
        },

        /**
         * Verification status - indicates if the source has been verified by a moderator/admin
         */
        verified: {
            type: Boolean,
            default: false,
            index: true,
        },

        /**
         * User who created this water source entry
         */
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required'],
            index: true,
        },

        /**
         * Optional: User who verified this water source
         */
        verified_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        /**
         * Optional: Verification timestamp
         */
        verified_at: {
            type: Date,
            default: null,
        },

        /**
         * Optional: Additional description or notes
         */
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },

        /**
         * Soft delete flag - instead of removing from database
         */
        is_deleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        /**
         * Optional: User who deleted this source
         */
        deleted_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        /**
         * Optional: Deletion timestamp
         */
        deleted_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

/**
 * Create a 2dsphere geospatial index on the location field
 * This enables geospatial queries like $near, $geoWithin, $geoIntersects
 */
waterSourceSchema.index({ location: '2dsphere' });

/**
 * Compound index for filtering by type and status
 */
waterSourceSchema.index({ type: 1, operational_status: 1 });

/**
 * Index for non-deleted sources (commonly queried)
 */
waterSourceSchema.index({ is_deleted: 1, createdAt: -1 });

/**
 * Virtual field to get formatted coordinates as [lat, lng] for frontend convenience
 */
waterSourceSchema.virtual('coordinates_lat_lng').get(function () {
    if (this.location && this.location.coordinates) {
        return {
            latitude: this.location.coordinates[1],
            longitude: this.location.coordinates[0],
        };
    }
    return null;
});

/**
 * Static method to find nearby water sources within a specified radius
 * 
 * @param {Number} longitude - User's longitude
 * @param {Number} latitude - User's latitude
 * @param {Number} radiusInMeters - Search radius in meters (default 5000m = 5km)
 * @param {Object} filters - Additional filters (type, operational_status, etc.)
 * @returns {Promise<Array>} Array of nearby water sources
 */
waterSourceSchema.statics.findNearby = async function (
    longitude,
    latitude,
    radiusInMeters = 5000,
    filters = {}
) {
    const query = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
                $maxDistance: radiusInMeters,
            },
        },
        is_deleted: false,
        ...filters,
    };

    return this.find(query).populate('created_by', 'name email');
};

/**
 * Static method to check if a water source already exists within a specific radius
 * Used to prevent duplicate submissions
 * 
 * @param {Number} longitude - Proposed source longitude
 * @param {Number} latitude - Proposed source latitude
 * @param {Number} radiusInMeters - Duplicate check radius (default 20m)
 * @returns {Promise<Boolean>} True if duplicate exists
 */
waterSourceSchema.statics.checkDuplicateNearby = async function (
    longitude,
    latitude,
    radiusInMeters = 20
) {
    const existing = await this.findOne({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
                $maxDistance: radiusInMeters,
            },
        },
        is_deleted: false,
    });

    return !!existing;
};

/**
 * Instance method to soft delete a water source
 */
waterSourceSchema.methods.softDelete = function (userId) {
    this.is_deleted = true;
    this.deleted_by = userId;
    this.deleted_at = new Date();
    return this.save();
};

const WaterSource = mongoose.model('WaterSource', waterSourceSchema);

module.exports = WaterSource;
module.exports.WaterSourceType = WaterSourceType;
module.exports.OperationalStatus = OperationalStatus;
module.exports.AccessType = AccessType;
