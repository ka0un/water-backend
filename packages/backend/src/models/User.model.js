const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User roles enum
 */
const UserRole = {
    USER: 'USER',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
    LAB_STAFF: 'LAB_STAFF',
};

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        lastLoginAt: {
            type: Date,
        },
        passwordChangedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

/**
 * Pre-save middleware to hash password
 * Using async function - no need for next() in Mongoose 5+
 */
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified
    if (!this.isModified('password')) {
        return;
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Update passwordChangedAt
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second for token comparison
    }
});

/**
 * Instance method to compare passwords
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to check if password was changed after token was issued
 */
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return jwtTimestamp < changedTimestamp;
    }
    return false;
};

/**
 * Static method to find user by email
 */
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = { User, UserRole };
