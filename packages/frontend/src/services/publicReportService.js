import { api } from '../context/AuthContext';

/**
 * Public Report API Service
 * Wraps /api/v1/public-reports endpoints for non-authenticated public users
 */

// We use the exported `api` from AuthContext. Even without a token,
// it works for public routes because empty Authorization headers don't cause 401s
// if the backend doesn't enforce authentication on these routes.

/**
 * Step 1: Initialize a new public report
 */
export const createPublicReport = async (nic) => {
    const { data } = await api.post('/public-reports', { nic });
    return data.data; // Returns the newly created public report object (wizard start)
};

/**
 * Step 2: Update an existing report (auto-save)
 */
export const updatePublicReport = async (id, updateBody) => {
    const { data } = await api.patch(`/public-reports/${id}`, updateBody);
    return data.data;
};

/**
 * Step 3: Final Submit
 */
export const submitPublicReport = async (id) => {
    const { data } = await api.post(`/public-reports/${id}/submit`);
    return data.data;
};

/**
 * Upload an Image
 */
export const uploadPublicReportImage = async (id, formData) => {
    const { data } = await api.post(`/public-reports/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};

/**
 * Track reports by NIC
 */
export const trackReportsByNic = async (nic) => {
    const { data } = await api.get(`/public-reports/by-nic/${nic}`);
    return data.data; // List of reports
};

/**
 * Get full report data by ID
 */
export const getFullPublicReport = async (id) => {
    const { data } = await api.get(`/public-reports/${id}/full`);
    return data.data;
};
