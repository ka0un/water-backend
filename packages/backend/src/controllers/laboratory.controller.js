const Laboratory = require('../models/Laboratory.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new laboratory
 * POST /api/admin/laboratories
 */
const createLaboratory = asyncHandler(async (req, res) => {
  const { name, location, email, phone, address, city, postalCode, country, operatingHours, capacity } = req.body;

  // Check if laboratory with same name or email already exists
  const existingLab = await Laboratory.findOne({
    $or: [{ name }, { email }],
  });

  if (existingLab) {
    throw new ApiError(409, 'Laboratory with this name or email already exists');
  }

  const laboratory = await Laboratory.create({
    name,
    location,
    email,
    phone,
    address,
    city,
    postalCode,
    country,
    operatingHours,
    capacity,
    certifications: req.body.certifications || [],
    equipmentList: req.body.equipmentList || [],
    description: req.body.description || '',
    status: 'active',
  });

  return res.status(201).json(
    new ApiResponse(201, laboratory, 'Laboratory created successfully')
  );
});

/**
 * Get all laboratories (with pagination and filtering)
 * GET /api/admin/laboratories
 */
const getAllLaboratories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = 'active', search } = req.query;

  const skip = (page - 1) * limit;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const laboratories = await Laboratory.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Laboratory.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      laboratories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Laboratories retrieved successfully')
  );
});

/**
 * Get a single laboratory by ID
 * GET /api/admin/laboratories/:id
 */
const getLaboratoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const laboratory = await Laboratory.findById(id);

  if (!laboratory) {
    throw new ApiError(404, 'Laboratory not found');
  }

  return res.status(200).json(
    new ApiResponse(200, laboratory, 'Laboratory retrieved successfully')
  );
});

/**
 * Update a laboratory
 * PUT /api/admin/laboratories/:id
 */
const updateLaboratory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const laboratory = await Laboratory.findById(id);

  if (!laboratory) {
    throw new ApiError(404, 'Laboratory not found');
  }

  // Check if new name or email already exists (excluding current lab)
  if (name || email) {
    const existingLab = await Laboratory.findOne({
      $or: [
        name ? { name } : null,
        email ? { email } : null,
      ].filter(Boolean),
      _id: { $ne: id },
    });

    if (existingLab) {
      throw new ApiError(409, 'Laboratory with this name or email already exists');
    }
  }

  // Update fields
  const updateData = {
    name: name || laboratory.name,
    location: req.body.location || laboratory.location,
    email: email || laboratory.email,
    phone: req.body.phone || laboratory.phone,
    address: req.body.address || laboratory.address,
    city: req.body.city || laboratory.city,
    postalCode: req.body.postalCode || laboratory.postalCode,
    country: req.body.country || laboratory.country,
    operatingHours: req.body.operatingHours || laboratory.operatingHours,
    capacity: req.body.capacity || laboratory.capacity,
    certifications: req.body.certifications || laboratory.certifications,
    equipmentList: req.body.equipmentList || laboratory.equipmentList,
    description: req.body.description || laboratory.description,
    status: req.body.status || laboratory.status,
  };

  const updatedLaboratory = await Laboratory.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return res.status(200).json(
    new ApiResponse(200, updatedLaboratory, 'Laboratory updated successfully')
  );
});

/**
 * Delete/Deactivate a laboratory
 * DELETE /api/admin/laboratories/:id
 */
const deleteLaboratory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const laboratory = await Laboratory.findById(id);

  if (!laboratory) {
    throw new ApiError(404, 'Laboratory not found');
  }

  // Soft delete by setting status to inactive
  laboratory.status = 'inactive';
  await laboratory.save();

  return res.status(200).json(
    new ApiResponse(200, laboratory, 'Laboratory deactivated successfully')
  );
});

/**
 * Permanently delete a laboratory
 * DELETE /api/admin/laboratories/:id?permanent=true
 */
const permanentlyDeleteLaboratory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const laboratory = await Laboratory.findByIdAndDelete(id);

  if (!laboratory) {
    throw new ApiError(404, 'Laboratory not found');
  }

  return res.status(200).json(
    new ApiResponse(200, {}, 'Laboratory permanently deleted successfully')
  );
});

module.exports = {
  createLaboratory,
  getAllLaboratories,
  getLaboratoryById,
  updateLaboratory,
  deleteLaboratory,
  permanentlyDeleteLaboratory,
};
