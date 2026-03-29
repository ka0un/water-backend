/**
 * Water Source API Service
 * Wraps all /api/v1/water-sources endpoints
 */

/**
 * Get all water sources with optional filters
 */
export const getWaterSources = async (api, params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.operational_status) query.set('operational_status', params.operational_status);
    if (params.access_type) query.set('access_type', params.access_type);
    if (params.verified !== undefined) query.set('verified', params.verified);
    query.set('page', params.page || 1);
    query.set('limit', params.limit || 100);
    if (params.sort) query.set('sort', params.sort);

    const { data } = await api.get(`/water-sources?${query.toString()}`);
    return data.data;
};

/**
 * Get water source by ID
 */
export const getWaterSourceById = async (api, id) => {
    const { data } = await api.get(`/water-sources/${id}`);
    return data.data;
};

/**
 * Get authenticated user's own water source submissions
 */
export const getMyWaterSources = async (api, params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.operational_status) query.set('operational_status', params.operational_status);
    if (params.access_type) query.set('access_type', params.access_type);
    if (params.verified !== undefined) query.set('verified', params.verified);
    query.set('page', params.page || 1);
    query.set('limit', params.limit || 100);
    if (params.sort) query.set('sort', params.sort);

    const { data } = await api.get(`/water-sources/mine?${query.toString()}`);
    return data.data;
};

/**
 * Create a new water source
 */
export const createWaterSource = async (api, payload) => {
    const { data } = await api.post('/water-sources', payload);
    return data.data;
};

/**
 * Update a water source
 */
export const updateWaterSource = async (api, id, payload) => {
    const { data } = await api.patch(`/water-sources/${id}`, payload);
    return data.data;
};

/**
 * Verify/approve a water source (Admin/Moderator only)
 */
export const verifyWaterSource = async (api, id) => {
    const { data } = await api.patch(`/water-sources/${id}/verify`);
    return data.data;
};

/**
 * Update operational status
 */
export const updateSourceStatus = async (api, id, operational_status, notes) => {
    const { data } = await api.patch(`/water-sources/${id}/status`, {
        operational_status,
        notes,
    });
    return data.data;
};

/**
 * Delete (soft delete) a water source
 */
export const deleteWaterSource = async (api, id) => {
    const { data } = await api.delete(`/water-sources/${id}`);
    return data.data;
};

/**
 * Get nearby water sources
 */
export const getNearbySources = async (api, latitude, longitude, radius = 5000, filters = {}) => {
    const query = new URLSearchParams();
    query.set('latitude', latitude);
    query.set('longitude', longitude);
    query.set('radius', radius);
    if (filters.type) query.set('type', filters.type);
    if (filters.operational_status) query.set('operational_status', filters.operational_status);
    if (filters.verified !== undefined) query.set('verified', filters.verified);

    const { data } = await api.get(`/water-sources/nearby?${query.toString()}`);
    return data.data;
};

/**
 * Get water source statistics
 */
export const getWaterSourceStats = async (api) => {
    const { data } = await api.get('/water-sources/stats');
    return data.data;
};
