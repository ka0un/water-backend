const mongoose = require('mongoose');

/**
 * Moderation status enum for public reports
 */
const ModStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

/**
 * Sub-schema for an observation field (detected? → type → amount/severity)
 */
const observationSchema = {
    detected: { type: Boolean, default: null },
    type: { type: String, default: null, trim: true },
    severity: { type: String, default: null, trim: true },
    amount: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
};

/**
 * Sub-schema for advanced test values
 */
const testValueSchema = {
    value: { type: Number, default: null },
    unit: { type: String, default: null, trim: true },
};

const publicReportSchema = new mongoose.Schema(
    {
        // ── Identity ──────────────────────────────────────────────
        nic: {
            type: String,
            required: [true, 'NIC number is required'],
            trim: true,
            index: true,
        },
        ipAddress: {
            type: String,
            trim: true,
            default: null,
            index: true,
        },

        // ── Water Source ──────────────────────────────────────────
        waterSource: {
            type: String,
            enum: ['well', 'river', 'lake', 'tap', 'tank', 'canal', 'spring', 'rainwater', 'borehole', 'other'],
            default: null,
        },
        waterSourceOther: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Location ─────────────────────────────────────────────
        location: {
            district: { type: String, default: null, trim: true },
            city: { type: String, default: null, trim: true },
            address: { type: String, default: null, trim: true },
            coordinates: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
            },
        },

        // ── Basic Visual Observations ────────────────────────────
        appearance: {
            value: { type: String, default: null, trim: true },
            notes: { type: String, default: null, trim: true },
        },
        smell: observationSchema,
        taste: observationSchema,
        turbidity: {
            value: { type: String, default: null, trim: true },
        },
        sediment: observationSchema,
        oilGrease: observationSchema,
        foamBubbles: observationSchema,
        algae: {
            detected: { type: Boolean, default: null },
            color: { type: String, default: null, trim: true },
            coverage: { type: String, default: null, trim: true },
            notes: { type: String, default: null, trim: true },
        },
        trashDebris: observationSchema,
        mudSilt: observationSchema,
        insectsLarvae: observationSchema,
        plantMatter: observationSchema,
        deadWildlife: observationSchema,
        pipeCondition: observationSchema,
        waterFlow: {
            type: String,
            default: null,
            trim: true,
        },
        temperature: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Testing Method Gate ──────────────────────────────────
        testingMethod: {
            type: String,
            enum: ['observation', 'test_strips', 'lab_kit', 'professional_lab', null],
            default: null,
        },

        // ── Advanced Test Parameters ─────────────────────────────
        advancedTests: {
            ph: testValueSchema,
            hardness: testValueSchema,
            chlorine: testValueSchema,
            tds: testValueSchema,
            cyanuricAcid: testValueSchema,
            bromine: testValueSchema,
            nitrate: testValueSchema,
            nitrite: testValueSchema,
            iron: testValueSchema,
            chromium: testValueSchema,
            lead: testValueSchema,
            copper: testValueSchema,
            mercury: testValueSchema,
            fluoride: testValueSchema,
            carbonate: testValueSchema,
            totalAlkalinity: testValueSchema,
        },

        // ── Contact Info (optional) ─────────────────────────────
        email: {
            type: String,
            default: null,
            trim: true,
        },
        phone: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Images (stored as base64 in MongoDB) ─────────────────
        images: [
            {
                imageType: {
                    type: String,
                    enum: ['water_source', 'water_sample', 'other'],
                    required: true,
                },
                data: {
                    type: String,  // base64 encoded
                    required: true,
                },
                contentType: {
                    type: String,
                    required: true,
                },
                filename: {
                    type: String,
                    default: null,
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // ── Wizard State ─────────────────────────────────────────
        currentStep: {
            type: Number,
            default: 0,
        },
        wizardCompleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },

        // ── Moderation ───────────────────────────────────────────
        mod_status: {
            type: String,
            enum: Object.values(ModStatus),
            default: ModStatus.PENDING,
            index: true,
        },
        moderator_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        approved_at: {
            type: Date,
            default: null,
        },
        rejected_at: {
            type: Date,
            default: null,
        },
        rejection_reason: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Soft Delete ─────────────────────────────────────────────
        deletedAt: {
            type: Date,
            default: null,
            index: true,
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

// Indexes
publicReportSchema.index({ nic: 1, wizardCompleted: 1 });
publicReportSchema.index({ createdAt: -1 });

// Soft-delete: auto-exclude deleted records from all queries
publicReportSchema.pre(/^find/, function () {
    if (this.getFilter().deletedAt === undefined && !this.getFilter()._includeDeleted) {
        this.where({ deletedAt: null });
    }
    // Clean up the helper flag
    if (this.getFilter()._includeDeleted) {
        delete this.getFilter()._includeDeleted;
    }
});
publicReportSchema.pre('countDocuments', function () {
    if (this.getFilter().deletedAt === undefined && !this.getFilter()._includeDeleted) {
        this.where({ deletedAt: null });
    }
    if (this.getFilter()._includeDeleted) {
        delete this.getFilter()._includeDeleted;
    }
});

const PublicReport = mongoose.model('PublicReport', publicReportSchema);

module.exports = {
    PublicReport,
    ModStatus,
};
