const Joi = require('joi');
const { WaterSourceType, OperationalStatus, AccessType } = require('../models/WaterSource.model');

/**
 * Validation schema for creating a new water source
 */
const createWaterSource = {
    body: Joi.object({
        name: Joi.string().trim().min(3).max(200).required().messages({
            'string.empty': 'Water source name is required',
            'string.min': 'Name must be at least 3 characters',
            'string.max': 'Name cannot exceed 200 characters',
            'any.required': 'Water source name is required',
        }),
        type: Joi.string()
            .valid(...Object.values(WaterSourceType))
            .required()
            .messages({
                'any.only': `Type must be one of: ${Object.values(WaterSourceType).join(', ')}`,
                'any.required': 'Water source type is required',
            }),
        location: Joi.object({
            latitude: Joi.number().min(-90).max(90).required().messages({
                'number.min': 'Latitude must be between -90 and 90',
                'number.max': 'Latitude must be between -90 and 90',
                'any.required': 'Latitude is required',
            }),
            longitude: Joi.number().min(-180).max(180).required().messages({
                'number.min': 'Longitude must be between -180 and 180',
                'number.max': 'Longitude must be between -180 and 180',
                'any.required': 'Longitude is required',
            }),
        })
            .required()
            .messages({
                'any.required': 'Location coordinates are required',
            }),
        operational_status: Joi.string()
            .valid(...Object.values(OperationalStatus))
            .optional()
            .messages({
                'any.only': `Operational status must be one of: ${Object.values(OperationalStatus).join(', ')}`,
            }),
        access_type: Joi.string()
            .valid(...Object.values(AccessType))
            .optional()
            .messages({
                'any.only': `Access type must be one of: ${Object.values(AccessType).join(', ')}`,
            }),
        description: Joi.string().trim().max(1000).optional().allow('').messages({
            'string.max': 'Description cannot exceed 1000 characters',
        }),
    }),
};

/**
 * Validation schema for getting water sources with filters
 */
const getWaterSources = {
    query: Joi.object({
        type: Joi.string()
            .valid(...Object.values(WaterSourceType))
            .optional()
            .messages({
                'any.only': `Type must be one of: ${Object.values(WaterSourceType).join(', ')}`,
            }),
        operational_status: Joi.string()
            .valid(...Object.values(OperationalStatus))
            .optional()
            .messages({
                'any.only': `Operational status must be one of: ${Object.values(OperationalStatus).join(', ')}`,
            }),
        access_type: Joi.string()
            .valid(...Object.values(AccessType))
            .optional()
            .messages({
                'any.only': `Access type must be one of: ${Object.values(AccessType).join(', ')}`,
            }),
        verified: Joi.boolean().optional(),
        page: Joi.number().integer().min(1).optional().default(1).messages({
            'number.min': 'Page must be at least 1',
        }),
        limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
        sort: Joi.string().optional().valid('createdAt', '-createdAt', 'name', '-name').default('-createdAt'),
    }),
};

/**
 * Validation schema for getting nearby water sources (geospatial query)
 */
const getNearbySources = {
    query: Joi.object({
        latitude: Joi.number().min(-90).max(90).required().messages({
            'number.min': 'Latitude must be between -90 and 90',
            'number.max': 'Latitude must be between -90 and 90',
            'any.required': 'Latitude is required',
        }),
        longitude: Joi.number().min(-180).max(180).required().messages({
            'number.min': 'Longitude must be between -180 and 180',
            'number.max': 'Longitude must be between -180 and 180',
            'any.required': 'Longitude is required',
        }),
        radius: Joi.number().min(100).max(50000).optional().default(5000).messages({
            'number.min': 'Radius must be at least 100 meters',
            'number.max': 'Radius cannot exceed 50000 meters (50km)',
        }),
        type: Joi.string()
            .valid(...Object.values(WaterSourceType))
            .optional(),
        operational_status: Joi.string()
            .valid(...Object.values(OperationalStatus))
            .optional(),
    }),
};

/**
 * Validation schema for getting a single water source by ID
 */
const getWaterSourceById = {
    params: Joi.object({
        id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid water source ID format',
                'any.required': 'Water source ID is required',
            }),
    }),
};

/**
 * Validation schema for updating water source status
 */
const updateSourceStatus = {
    params: Joi.object({
        id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid water source ID format',
                'any.required': 'Water source ID is required',
            }),
    }),
    body: Joi.object({
        operational_status: Joi.string()
            .valid(...Object.values(OperationalStatus))
            .required()
            .messages({
                'any.only': `Operational status must be one of: ${Object.values(OperationalStatus).join(', ')}`,
                'any.required': 'Operational status is required',
            }),
        notes: Joi.string().trim().max(500).optional().allow('').messages({
            'string.max': 'Notes cannot exceed 500 characters',
        }),
    }),
};

/**
 * Validation schema for updating water source details
 */
const updateWaterSource = {
    params: Joi.object({
        id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid water source ID format',
                'any.required': 'Water source ID is required',
            }),
    }),
    body: Joi.object({
        name: Joi.string().trim().min(3).max(200).optional(),
        type: Joi.string()
            .valid(...Object.values(WaterSourceType))
            .optional(),
        operational_status: Joi.string()
            .valid(...Object.values(OperationalStatus))
            .optional(),
        access_type: Joi.string()
            .valid(...Object.values(AccessType))
            .optional(),
        description: Joi.string().trim().max(1000).optional().allow(''),
    }).min(1), // At least one field must be provided
};

/**
 * Validation schema for verifying a water source
 */
const verifyWaterSource = {
    params: Joi.object({
        id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid water source ID format',
                'any.required': 'Water source ID is required',
            }),
    }),
};

/**
 * Validation schema for soft deleting a water source
 */
const deleteWaterSource = {
    params: Joi.object({
        id: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid water source ID format',
                'any.required': 'Water source ID is required',
            }),
    }),
};

module.exports = {
    createWaterSource,
    getWaterSources,
    getNearbySources,
    getWaterSourceById,
    updateSourceStatus,
    updateWaterSource,
    verifyWaterSource,
    deleteWaterSource,
};
