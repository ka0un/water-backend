const Joi = require('joi');

/**
 * Sri Lankan NIC pattern:
 *  - Old format: 9 digits + V or X  (e.g. 901234567V)
 *  - New format: 12 digits           (e.g. 200012345678)
 */
const nicPattern = /^([0-9]{9}[VvXx]|[0-9]{12})$/;

/**
 * Schema: create a new report (wizard start)
 */
const createReportSchema = Joi.object({
    nic: Joi.string()
        .trim()
        .pattern(nicPattern)
        .required()
        .messages({
            'string.empty': 'NIC number is required',
            'string.pattern.base': 'Please provide a valid Sri Lankan NIC number',
            'any.required': 'NIC number is required',
        }),
});

// ── Reusable sub-schemas ──────────────────────────────────────
const observationObj = Joi.object({
    detected: Joi.boolean().allow(null),
    type: Joi.string().allow(null, ''),
    severity: Joi.string().allow(null, ''),
    amount: Joi.string().allow(null, ''),
    notes: Joi.string().allow(null, ''),
});

const testValueObj = Joi.object({
    value: Joi.number().allow(null),
    unit: Joi.string().allow(null, ''),
});

/**
 * Schema: update / auto-save wizard step
 * All fields optional so we can patch one step at a time.
 */
const updateReportSchema = Joi.object({
    waterSource: Joi.string()
        .valid('well', 'river', 'lake', 'tap', 'tank', 'canal', 'spring', 'rainwater', 'borehole', 'other')
        .allow(null),
    waterSourceOther: Joi.string().allow(null, ''),

    location: Joi.object({
        district: Joi.string().allow(null, ''),
        city: Joi.string().allow(null, ''),
        address: Joi.string().allow(null, ''),
        coordinates: Joi.object({
            lat: Joi.number().allow(null),
            lng: Joi.number().allow(null),
        }),
    }),

    // Basic observations
    appearance: Joi.object({
        value: Joi.string().allow(null, ''),
        notes: Joi.string().allow(null, ''),
    }),
    smell: observationObj,
    taste: observationObj,
    turbidity: Joi.object({
        value: Joi.string().allow(null, ''),
    }),
    sediment: observationObj,
    oilGrease: observationObj,
    foamBubbles: observationObj,
    algae: Joi.object({
        detected: Joi.boolean().allow(null),
        color: Joi.string().allow(null, ''),
        coverage: Joi.string().allow(null, ''),
        notes: Joi.string().allow(null, ''),
    }),
    trashDebris: observationObj,
    mudSilt: observationObj,
    insectsLarvae: observationObj,
    plantMatter: observationObj,
    deadWildlife: observationObj,
    pipeCondition: observationObj,
    waterFlow: Joi.string().allow(null, ''),
    temperature: Joi.string().allow(null, ''),

    // Testing method
    testingMethod: Joi.string()
        .valid('observation', 'test_strips', 'lab_kit', 'professional_lab')
        .allow(null),

    // Advanced tests
    advancedTests: Joi.object({
        ph: testValueObj,
        hardness: testValueObj,
        chlorine: testValueObj,
        tds: testValueObj,
        cyanuricAcid: testValueObj,
        bromine: testValueObj,
        nitrate: testValueObj,
        nitrite: testValueObj,
        iron: testValueObj,
        chromium: testValueObj,
        lead: testValueObj,
        copper: testValueObj,
        mercury: testValueObj,
        fluoride: testValueObj,
        carbonate: testValueObj,
        totalAlkalinity: testValueObj,
    }),

    // Wizard state
    currentStep: Joi.number().integer().min(0),
}).min(1); // at least one field must be provided

/**
 * Schema: NIC param for lookup
 */
const nicParamSchema = Joi.object({
    nic: Joi.string()
        .trim()
        .pattern(nicPattern)
        .required()
        .messages({
            'string.pattern.base': 'Please provide a valid Sri Lankan NIC number',
        }),
});

module.exports = {
    createReportSchema,
    updateReportSchema,
    nicParamSchema,
};
