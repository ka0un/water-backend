const express = require('express');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

/**
 * @route   GET /api/v1/config/map-key
 * @desc    Get Google Maps API key for frontend use
 * @access  Public
 */
router.get('/map-key', (req, res) => {
    const apiKey = process.env.Google_Map_apiKey || '';
    return ApiResponse.success(res, { apiKey }, 'Map API key retrieved successfully');
});

module.exports = router;
