const mongoose = require('mongoose');

const BannedUserSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['ip', 'nic'],
            required: [true, 'Ban type is required'],
            index: true,
        },
        value: {
            type: String,
            required: [true, 'Ban value (IP or NIC) is required'],
            trim: true,
            index: true,
        },
        reason: {
            type: String,
            trim: true,
        },
        bannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate bans for the same value
BannedUserSchema.index({ type: 1, value: 1 }, { unique: true });

const BannedUser = mongoose.model('BannedUser', BannedUserSchema);

module.exports = BannedUser;
