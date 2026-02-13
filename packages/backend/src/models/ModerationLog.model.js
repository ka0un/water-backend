const mongoose = require('mongoose');

/**
 * Moderation actions enum
 */
const ModerationAction = {
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
    BAN: 'BAN',
    UNBAN: 'UNBAN',
    VERIFY_PHOTO: 'VERIFY_PHOTO',
    VERIFY_LOCATION: 'VERIFY_LOCATION',
    MARK_DUPLICATE: 'MARK_DUPLICATE',
};

const moderationLogSchema = new mongoose.Schema(
    {
        /**
         * Type of moderation action performed.
         * Example: APPROVE, REJECT, BAN, etc.
         */
        action: {
            type: String,
            enum: Object.values(ModerationAction),
            required: true,
        },

        /**
         * Moderator who performed the action.
         */
        moderatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        /**
         * Optional: user who was the target of the moderation action
         * (e.g., banning a user).
         */
        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        /**
         * Optional: related report / water test.
         * This can reference WaterTest or another report collection.
         */
        reportId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WaterTest',
            default: null,
            index: true,
        },

        /**
         * Status before the action was applied.
         * Example: "Pending"
         */
        previousStatus: {
            type: String,
            default: null,
        },

        /**
         * Status after the action was applied.
         * Example: "Approved - Lab Testing Requested"
         */
        newStatus: {
            type: String,
            default: null,
        },

        /**
         * Optional text reason for the moderation decision.
         */
        reason: {
            type: String,
            default: null,
            trim: true,
        },

        /**
         * When the moderation action occurred.
         * Defaults to "now".
         */
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
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

// Compound indexes to support common queries
moderationLogSchema.index({ moderatorId: 1, timestamp: -1 });
moderationLogSchema.index({ reportId: 1, timestamp: -1 });

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);

module.exports = {
    ModerationLog,
    ModerationAction,
};

