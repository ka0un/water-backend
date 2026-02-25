const mongoose = require('mongoose');

/**
 * Lab Test Request Status enum
 */
const LabTestStatus = {
    PENDING_ACCEPTANCE: 'pending_acceptance',  // Waiting for lab to accept
    ACCEPTED: 'accepted',                       // Lab accepted, awaiting scheduling
    SAMPLE_SCHEDULED: 'sample_scheduled',       // Sample collection scheduled
    SAMPLE_COLLECTED: 'sample_collected',       // Sample collected, ready for testing
    TESTING_IN_PROGRESS: 'testing_in_progress', // Currently being tested
    COMPLETED: 'completed',                     // Testing complete, results available
    REJECTED: 'rejected',                       // Lab rejected the request
};

/**
 * Test Verdict enum
 */
const TestVerdict = {
    SAFE: 'safe',
    UNSAFE: 'unsafe',
    NEEDS_TREATMENT: 'needs_treatment',
    PENDING: 'pending',
};

/**
 * Water quality parameter safe limits (WHO standards)
 */
const SAFE_LIMITS = {
    ph: { min: 6.5, max: 8.5, unit: 'pH' },
    turbidity: { max: 5, unit: 'NTU' },
    totalDissolvedSolids: { max: 500, unit: 'mg/L' },
    lead: { max: 0.01, unit: 'mg/L' },
    arsenic: { max: 0.01, unit: 'mg/L' },
    mercury: { max: 0.001, unit: 'mg/L' },
    cadmium: { max: 0.003, unit: 'mg/L' },
    chromium: { max: 0.05, unit: 'mg/L' },
    copper: { max: 2, unit: 'mg/L' },
    iron: { max: 0.3, unit: 'mg/L' },
    manganese: { max: 0.1, unit: 'mg/L' },
    zinc: { max: 3, unit: 'mg/L' },
    nitrate: { max: 50, unit: 'mg/L' },
    nitrite: { max: 3, unit: 'mg/L' },
    fluoride: { max: 1.5, unit: 'mg/L' },
    chloride: { max: 250, unit: 'mg/L' },
    sulfate: { max: 250, unit: 'mg/L' },
    coliformBacteria: { max: 0, unit: 'CFU/100mL' },
    ecoliCount: { max: 0, unit: 'CFU/100mL' },
};

/**
 * Test result schema for individual parameters
 */
const testResultSchema = new mongoose.Schema({
    value: { type: Number, default: null },
    unit: { type: String, default: null },
    safeLimit: { type: Number, default: null },
    isWithinLimit: { type: Boolean, default: null },
    testedAt: { type: Date, default: null },
    notes: { type: String, default: null },
}, { _id: false });

/**
 * Sample collection photo schema
 */
const samplePhotoSchema = new mongoose.Schema({
    data: { type: String },      // Base64 encoded
    contentType: { type: String, default: 'image/jpeg' },
    caption: { type: String },
    takenAt: { type: Date, default: Date.now },
}, { _id: true });

const labTestRequestSchema = new mongoose.Schema(
    {
        // ── Reference to Public Report ────────────────────────────
        publicReport: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PublicReport',
            required: true,
            index: true,
        },

        // ── Reference to Laboratory ───────────────────────────────
        laboratory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Laboratory',
            default: null,
        },

        // ── Request Details ───────────────────────────────────────
        requestNumber: {
            type: String,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(LabTestStatus),
            default: LabTestStatus.PENDING_ACCEPTANCE,
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },

        // ── Requested Tests ───────────────────────────────────────
        requestedTests: [{
            type: String,
            enum: ['basic_physical', 'chemical', 'heavy_metals', 'bacteriological', 'full_analysis'],
        }],

        // ── Lab Staff Actions ─────────────────────────────────────
        acceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        acceptedAt: { type: Date, default: null },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        rejectedAt: { type: Date, default: null },
        rejectionReason: { type: String, default: null },

        // ── Sample Collection Schedule ────────────────────────────
        scheduledCollection: {
            date: { type: Date, default: null },
            timeSlot: { type: String, default: null },  // e.g., "10:00 AM - 12:00 PM"
            assignedCollector: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
            contactPhone: { type: String, default: null },
            specialInstructions: { type: String, default: null },
        },

        // ── Sample Collection Details ─────────────────────────────
        sampleCollection: {
            collectedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
            collectedAt: { type: Date, default: null },
            location: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
                accuracy: { type: Number, default: null },  // GPS accuracy in meters
                address: { type: String, default: null },
            },
            sampleId: { type: String, default: null },      // Unique sample identifier
            bottleType: { type: String, default: null },    // e.g., "sterile plastic", "glass"
            volumeCollected: { type: Number, default: null }, // in mL
            waterTemperature: { type: Number, default: null }, // at collection time
            weatherConditions: { type: String, default: null },
            photos: [samplePhotoSchema],
            notes: { type: String, default: null },
        },

        // ── Laboratory Testing ────────────────────────────────────
        testing: {
            startedAt: { type: Date, default: null },
            completedAt: { type: Date, default: null },
            testedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
            labNotes: { type: String, default: null },
        },

        // ── Test Results ──────────────────────────────────────────
        results: {
            // Physical Parameters
            ph: testResultSchema,
            turbidity: testResultSchema,
            color: testResultSchema,
            odor: { type: String, default: null },
            taste: { type: String, default: null },
            temperature: testResultSchema,
            totalDissolvedSolids: testResultSchema,
            conductivity: testResultSchema,

            // Chemical Parameters
            nitrate: testResultSchema,
            nitrite: testResultSchema,
            fluoride: testResultSchema,
            chloride: testResultSchema,
            sulfate: testResultSchema,
            hardness: testResultSchema,
            alkalinity: testResultSchema,
            dissolvedOxygen: testResultSchema,

            // Heavy Metals
            lead: testResultSchema,
            arsenic: testResultSchema,
            mercury: testResultSchema,
            cadmium: testResultSchema,
            chromium: testResultSchema,
            copper: testResultSchema,
            iron: testResultSchema,
            manganese: testResultSchema,
            zinc: testResultSchema,

            // Bacteriological
            coliformBacteria: testResultSchema,
            ecoliCount: testResultSchema,
            fecalColiform: testResultSchema,
        },

        // ── Final Verdict ─────────────────────────────────────────
        verdict: {
            result: {
                type: String,
                enum: Object.values(TestVerdict),
                default: TestVerdict.PENDING,
            },
            summary: { type: String, default: null },
            failedParameters: [{ type: String }],
            recommendations: [{ type: String }],
            issuedAt: { type: Date, default: null },
            issuedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
        },

        // ── Report Generation ─────────────────────────────────────
        finalReport: {
            generatedAt: { type: Date, default: null },
            reportNumber: { type: String, default: null },
            pdfUrl: { type: String, default: null },
        },

        // ── Metadata ──────────────────────────────────────────────
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Generate unique request number before save
labTestRequestSchema.pre('save', async function () {
    if (this.isNew && !this.requestNumber) {
        const count = await mongoose.model('LabTestRequest').countDocuments();
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        this.requestNumber = `LTR-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
    }
});

// Virtual: days since request created
labTestRequestSchema.virtual('daysSinceCreated').get(function () {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual: is overdue (more than 7 days without completion)
labTestRequestSchema.virtual('isOverdue').get(function () {
    if (this.status === LabTestStatus.COMPLETED || this.status === LabTestStatus.REJECTED) {
        return false;
    }
    return this.daysSinceCreated > 7;
});

// Indexes
labTestRequestSchema.index({ createdAt: -1 });
labTestRequestSchema.index({ 'verdict.result': 1 });
labTestRequestSchema.index({ laboratory: 1, status: 1 });

// Static method: get safe limits
labTestRequestSchema.statics.getSafeLimits = function () {
    return SAFE_LIMITS;
};

// Instance method: calculate verdict based on results
labTestRequestSchema.methods.calculateVerdict = function () {
    const failedParams = [];
    const results = this.results;

    for (const [param, limits] of Object.entries(SAFE_LIMITS)) {
        const result = results[param];
        if (result && result.value !== null) {
            let isWithinLimit = true;
            
            if (limits.min !== undefined && result.value < limits.min) {
                isWithinLimit = false;
            }
            if (limits.max !== undefined && result.value > limits.max) {
                isWithinLimit = false;
            }
            
            result.isWithinLimit = isWithinLimit;
            result.safeLimit = limits.max || limits.min;
            result.unit = limits.unit;

            if (!isWithinLimit) {
                failedParams.push(param);
            }
        }
    }

    this.verdict.failedParameters = failedParams;

    if (failedParams.length === 0) {
        this.verdict.result = TestVerdict.SAFE;
        this.verdict.summary = 'Water is safe for consumption. All parameters are within acceptable limits.';
    } else if (failedParams.some(p => ['lead', 'arsenic', 'mercury', 'coliformBacteria', 'ecoliCount'].includes(p))) {
        this.verdict.result = TestVerdict.UNSAFE;
        this.verdict.summary = `UNSAFE - Water is not safe for consumption. Critical parameters exceeded: ${failedParams.join(', ')}`;
    } else {
        this.verdict.result = TestVerdict.NEEDS_TREATMENT;
        this.verdict.summary = `Water needs treatment before consumption. Parameters exceeded: ${failedParams.join(', ')}`;
    }

    return this.verdict;
};

const LabTestRequest = mongoose.model('LabTestRequest', labTestRequestSchema);

module.exports = {
    LabTestRequest,
    LabTestStatus,
    TestVerdict,
    SAFE_LIMITS,
};
