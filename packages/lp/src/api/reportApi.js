import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1/public-reports',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Create a new report (wizard start)
 */
export const createReport = async (nic) => {
    const { data } = await api.post('/', { nic });
    return data.data.report;
};

/**
 * Get a report by ID
 */
export const getReport = async (id) => {
    const { data } = await api.get(`/${id}`);
    return data.data.report;
};

/**
 * Auto-save a wizard step (partial update)
 */
export const updateReport = async (id, updates) => {
    const { data } = await api.patch(`/${id}`, updates);
    return data.data.report;
};

/**
 * Find reports by NIC number
 */
export const getReportsByNic = async (nic) => {
    const { data } = await api.get(`/by-nic/${nic}`);
    return data.data.reports;
};

/**
 * Submit / finalize a report
 */
export const submitReport = async (id) => {
    const { data } = await api.post(`/${id}/submit`);
    return data.data.report;
};

export default api;
