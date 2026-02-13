const mongoose = require('mongoose');

/**
 * Water test status enum
 *
 * NOTE: Values are stored in the database exactly as written here
 * to match the product wording.
 */
const WaterTestStatus = {
    PENDING: 'Pending',
    APPROVED_LAB_TESTING_REQUESTED: 'Approved - Lab Testing Requested',
    REJECTED: 'Rejected',
};

const waterTestSchema = new mongoose.Schema(
    {
        // TODO: Add core business fields here (location, photos, measurements, etc.)

        /**
         * Moderation / review status
         */
        status: {
            type: String,
            enum: Object.values(WaterTestStatus),
            default: WaterTestStatus.PENDING,
            index: true,
        },

        /**
         * Moderator who approved or rejected the water test
         */
        moderatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },

        /**
         * Timestamps and metadata for approval / rejection
         */
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: null,
            trim: true,
        },

        /**
         * Photo verification fields
         */
        isVerified: {
            type: Boolean,
            default: false,
            index: true,
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        verificationDate: {
            type: Date,
            default: null,
        },

        /**
         * Location verification fields
         */
        verifiedLocation: {
            type: Boolean,
            default: false,
            index: true,
        },
        locationVerifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        locationVerifiedAt: {
            type: Date,
            default: null,
        },

        /**
         * Duplicate checking fields
         */
        isDuplicate: {
            type: Boolean,
            default: false,
            index: true,
        },
        duplicateOf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WaterTest',
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

// Helpful indexes for querying by moderation fields
waterTestSchema.index({ status: 1 });
waterTestSchema.index({ isVerified: 1 });
waterTestSchema.index({ verifiedLocation: 1 });
waterTestSchema.index({ isDuplicate: 1 });
waterTestSchema.index({ createdAt: -1 });

const WaterTest = mongoose.model('WaterTest', waterTestSchema);

module.exports = {
    WaterTest,
    WaterTestStatus,
};

