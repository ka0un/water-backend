const express = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const auth = require('../middlewares/auth.middleware');
const {
  createLaboratory,
  getAllLaboratories,
  getLaboratoryById,
  updateLaboratory,
  deleteLaboratory,
  permanentlyDeleteLaboratory,
} = require('../controllers/laboratory.controller');

const router = express.Router();

// Validation schemas
const createLabSchema = Joi.object({
  name: Joi.string().required().trim(),
  location: Joi.string().required().trim(),
  email: Joi.string().email().required().lowercase(),
  phone: Joi.string().required().length(10).pattern(/^[0-9]+$/).messages({
    'string.length': 'Phone number must be exactly 10 digits',
    'string.pattern.base': 'Phone number must contain only digits',
  }),
  address: Joi.string().required().trim(),
  city: Joi.string().required().trim(),
  postalCode: Joi.string().required(),
  country: Joi.string().required().trim(),
  operatingHours: Joi.string().required(),
  capacity: Joi.number().required().min(1),
  certifications: Joi.array().items(Joi.string()).optional(),
  equipmentList: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
});

const updateLabSchema = Joi.object({
  name: Joi.string().optional().trim(),
  location: Joi.string().optional().trim(),
  email: Joi.string().email().optional().lowercase(),
  phone: Joi.string().optional().length(10).pattern(/^[0-9]+$/).messages({
    'string.length': 'Phone number must be exactly 10 digits',
    'string.pattern.base': 'Phone number must contain only digits',
  }),
  address: Joi.string().optional().trim(),
  city: Joi.string().optional().trim(),
  postalCode: Joi.string().optional(),
  country: Joi.string().optional().trim(),
  operatingHours: Joi.string().optional(),
  capacity: Joi.number().optional().min(1),
  certifications: Joi.array().items(Joi.string()).optional(),
  equipmentList: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
});

// All laboratory routes require authentication and admin authorization
router.use(auth);
router.use(authorize('ADMIN'));

/**
 * POST /api/admin/laboratories
 * Create a new laboratory
 */
router.post(
  '/',
  (req, res, next) => validate(createLabSchema)(req, res, next),
  createLaboratory
);

/**
 * GET /api/admin/laboratories
 * Get all laboratories with pagination and filtering
 */
router.get('/', getAllLaboratories);

/**
 * GET /api/admin/laboratories/:id
 * Get a single laboratory by ID
 */
router.get('/:id', getLaboratoryById);

/**
 * PUT /api/admin/laboratories/:id
 * Update a laboratory
 */
router.put(
  '/:id',
  (req, res, next) => validate(updateLabSchema)(req, res, next),
  updateLaboratory
);

/**
 * DELETE /api/admin/laboratories/:id
 * Soft delete (deactivate) a laboratory
 */
router.delete('/:id', deleteLaboratory);

module.exports = router;
