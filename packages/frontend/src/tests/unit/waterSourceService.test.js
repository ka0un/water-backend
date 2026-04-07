/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  UNIT TESTS — waterSourceService.js  (Frontend)
 *
 *  Strategy: Inject a mock `api` object (simulating an axios instance) into
 *  every service function.  No real HTTP calls are made.
 *
 *  Coverage targets: all 9 exported functions
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
    getWaterSources,
    getWaterSourceById,
    getMyWaterSources,
    createWaterSource,
    updateWaterSource,
    verifyWaterSource,
    updateSourceStatus,
    deleteWaterSource,
    getNearbySources,
    getWaterSourceStats,
} from '../../services/waterSourceService';

// ── Shared mock API factory ───────────────────────────────────────────────────
const mockApi = (responseData) => ({
    get: vi.fn().mockResolvedValue({ data: { data: responseData } }),
    post: vi.fn().mockResolvedValue({ data: { data: responseData } }),
    patch: vi.fn().mockResolvedValue({ data: { data: responseData } }),
    delete: vi.fn().mockResolvedValue({ data: { data: responseData } }),
});

// ── Sample fixtures ───────────────────────────────────────────────────────────
const SAMPLE_SOURCE = {
    _id: 'abc123',
    name: 'Community Well',
    type: 'Well',
    operational_status: 'Functional',
    access_type: 'Public',
    verified: false,
};

const SAMPLE_SOURCES_LIST = {
    sources: [SAMPLE_SOURCE],
    pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. getWaterSources
// ═════════════════════════════════════════════════════════════════════════════
describe('getWaterSources()', () => {
    it('FE-WS-001: should call GET /water-sources with default page and limit', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api);

        expect(api.get).toHaveBeenCalledTimes(1);
        const url = api.get.mock.calls[0][0];
        expect(url).toContain('/water-sources');
        expect(url).toContain('page=1');
        expect(url).toContain('limit=100');
    });

    it('FE-WS-002: should include type param when provided', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, { type: 'Well' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('type=Well');
    });

    it('FE-WS-003: should include operational_status param when provided', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, { operational_status: 'Broken' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('operational_status=Broken');
    });

    it('FE-WS-004: should include access_type param when provided', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, { access_type: 'Public' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('access_type=Public');
    });

    it('FE-WS-005: should include verified param when explicitly set to false', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, { verified: false });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('verified=false');
    });

    it('FE-WS-006: should include sort param when provided', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, { sort: '-createdAt' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('sort=-createdAt');
    });

    it('FE-WS-007: should use custom page and limit', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, { page: 2, limit: 20 });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('page=2');
        expect(url).toContain('limit=20');
    });

    it('FE-WS-008: should return the data from the response', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        const result = await getWaterSources(api);

        expect(result).toEqual(SAMPLE_SOURCES_LIST);
    });

    it('FE-WS-009: should NOT include type in URL when not provided', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getWaterSources(api, {});

        const url = api.get.mock.calls[0][0];
        expect(url).not.toContain('type=');
    });

    it('FE-WS-010: should propagate API errors', async () => {
        const api = {
            get: vi.fn().mockRejectedValue(new Error('Network Error')),
        };
        await expect(getWaterSources(api)).rejects.toThrow('Network Error');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. getWaterSourceById
// ═════════════════════════════════════════════════════════════════════════════
describe('getWaterSourceById()', () => {
    it('FE-WS-011: should call GET /water-sources/:id', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        await getWaterSourceById(api, 'abc123');

        expect(api.get).toHaveBeenCalledWith('/water-sources/abc123');
    });

    it('FE-WS-012: should return the source data', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        const result = await getWaterSourceById(api, 'abc123');

        expect(result).toEqual(SAMPLE_SOURCE);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. getMyWaterSources
// ═════════════════════════════════════════════════════════════════════════════
describe('getMyWaterSources()', () => {
    it('FE-WS-013: should call GET /water-sources/mine', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getMyWaterSources(api);

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('/water-sources/mine');
    });

    it('FE-WS-014: should include default page and limit', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getMyWaterSources(api);

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('page=1');
        expect(url).toContain('limit=100');
    });

    it('FE-WS-015: should include type filter when supplied', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        await getMyWaterSources(api, { type: 'River' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('type=River');
    });

    it('FE-WS-016: should return the data payload', async () => {
        const api = mockApi(SAMPLE_SOURCES_LIST);
        const result = await getMyWaterSources(api);

        expect(result).toEqual(SAMPLE_SOURCES_LIST);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. createWaterSource
// ═════════════════════════════════════════════════════════════════════════════
describe('createWaterSource()', () => {
    const payload = {
        name: 'New Well',
        type: 'Well',
        location: { latitude: 6.93, longitude: 79.86 },
        operational_status: 'Functional',
        access_type: 'Public',
    };

    it('FE-WS-017: should call POST /water-sources with the payload', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        await createWaterSource(api, payload);

        expect(api.post).toHaveBeenCalledWith('/water-sources', payload);
    });

    it('FE-WS-018: should return the created source data', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        const result = await createWaterSource(api, payload);

        expect(result).toEqual(SAMPLE_SOURCE);
    });

    it('FE-WS-019: should propagate API errors on creation failure', async () => {
        const api = {
            post: vi.fn().mockRejectedValue(new Error('409 Conflict')),
        };
        await expect(createWaterSource(api, payload)).rejects.toThrow('409 Conflict');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. updateWaterSource
// ═════════════════════════════════════════════════════════════════════════════
describe('updateWaterSource()', () => {
    it('FE-WS-020: should call PATCH /water-sources/:id with the payload', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        await updateWaterSource(api, 'abc123', { name: 'Updated Well' });

        expect(api.patch).toHaveBeenCalledWith('/water-sources/abc123', { name: 'Updated Well' });
    });

    it('FE-WS-021: should return updated source data', async () => {
        const updated = { ...SAMPLE_SOURCE, name: 'Updated Well' };
        const api = mockApi(updated);
        const result = await updateWaterSource(api, 'abc123', { name: 'Updated Well' });

        expect(result).toEqual(updated);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. verifyWaterSource
// ═════════════════════════════════════════════════════════════════════════════
describe('verifyWaterSource()', () => {
    it('FE-WS-022: should call PATCH /water-sources/:id/verify', async () => {
        const api = mockApi({ ...SAMPLE_SOURCE, verified: true });
        await verifyWaterSource(api, 'abc123');

        expect(api.patch).toHaveBeenCalledWith('/water-sources/abc123/verify');
    });

    it('FE-WS-023: should return verified source data', async () => {
        const verified = { ...SAMPLE_SOURCE, verified: true };
        const api = mockApi(verified);
        const result = await verifyWaterSource(api, 'abc123');

        expect(result.verified).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. updateSourceStatus
// ═════════════════════════════════════════════════════════════════════════════
describe('updateSourceStatus()', () => {
    it('FE-WS-024: should call PATCH /water-sources/:id/status with status and notes', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        await updateSourceStatus(api, 'abc123', 'Broken', 'Pump broken');

        expect(api.patch).toHaveBeenCalledWith('/water-sources/abc123/status', {
            operational_status: 'Broken',
            notes: 'Pump broken',
        });
    });

    it('FE-WS-025: should work without notes (undefined)', async () => {
        const api = mockApi(SAMPLE_SOURCE);
        await updateSourceStatus(api, 'abc123', 'Maintenance', undefined);

        expect(api.patch).toHaveBeenCalledWith('/water-sources/abc123/status', {
            operational_status: 'Maintenance',
            notes: undefined,
        });
    });

    it('FE-WS-026: should return the updated source payload', async () => {
        const updated = { ...SAMPLE_SOURCE, operational_status: 'Broken' };
        const api = mockApi(updated);
        const result = await updateSourceStatus(api, 'abc123', 'Broken');

        expect(result.operational_status).toBe('Broken');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. deleteWaterSource
// ═════════════════════════════════════════════════════════════════════════════
describe('deleteWaterSource()', () => {
    it('FE-WS-027: should call DELETE /water-sources/:id', async () => {
        const api = mockApi({ id: 'abc123' });
        await deleteWaterSource(api, 'abc123');

        expect(api.delete).toHaveBeenCalledWith('/water-sources/abc123');
    });

    it('FE-WS-028: should return the deleted item id payload', async () => {
        const api = mockApi({ id: 'abc123' });
        const result = await deleteWaterSource(api, 'abc123');

        expect(result).toEqual({ id: 'abc123' });
    });

    it('FE-WS-029: should propagate 403 errors when unauthorized', async () => {
        const api = {
            delete: vi.fn().mockRejectedValue(new Error('403 Forbidden')),
        };
        await expect(deleteWaterSource(api, 'abc123')).rejects.toThrow('403 Forbidden');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. getNearbySources
// ═════════════════════════════════════════════════════════════════════════════
describe('getNearbySources()', () => {
    const NEARBY_RESULT = {
        sources: [SAMPLE_SOURCE],
        count: 1,
        center: { latitude: 6.93, longitude: 79.86 },
        radius: 5000,
    };

    it('FE-WS-030: should call GET /water-sources/nearby with lat/lng/radius', async () => {
        const api = mockApi(NEARBY_RESULT);
        await getNearbySources(api, 6.93, 79.86, 5000);

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('/water-sources/nearby');
        expect(url).toContain('latitude=6.93');
        expect(url).toContain('longitude=79.86');
        expect(url).toContain('radius=5000');
    });

    it('FE-WS-031: should default radius to 5000 when not provided', async () => {
        const api = mockApi(NEARBY_RESULT);
        await getNearbySources(api, 6.93, 79.86);

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('radius=5000');
    });

    it('FE-WS-032: should include type filter when provided', async () => {
        const api = mockApi(NEARBY_RESULT);
        await getNearbySources(api, 6.93, 79.86, 3000, { type: 'Well' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('type=Well');
    });

    it('FE-WS-033: should include operational_status filter when provided', async () => {
        const api = mockApi(NEARBY_RESULT);
        await getNearbySources(api, 6.93, 79.86, 3000, { operational_status: 'Functional' });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('operational_status=Functional');
    });

    it('FE-WS-034: should include verified filter when provided', async () => {
        const api = mockApi(NEARBY_RESULT);
        await getNearbySources(api, 6.93, 79.86, 3000, { verified: true });

        const url = api.get.mock.calls[0][0];
        expect(url).toContain('verified=true');
    });

    it('FE-WS-035: should NOT include optional filters when not provided', async () => {
        const api = mockApi(NEARBY_RESULT);
        await getNearbySources(api, 6.93, 79.86, 5000, {});

        const url = api.get.mock.calls[0][0];
        expect(url).not.toContain('type=');
        expect(url).not.toContain('operational_status=');
    });

    it('FE-WS-036: should return the source list payload', async () => {
        const api = mockApi(NEARBY_RESULT);
        const result = await getNearbySources(api, 6.93, 79.86);

        expect(result).toEqual(NEARBY_RESULT);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. getWaterSourceStats
// ═════════════════════════════════════════════════════════════════════════════
describe('getWaterSourceStats()', () => {
    const STATS = {
        total: 5,
        verified: 2,
        unverified: 3,
        byType: { Well: 3, River: 2 },
        byStatus: { Functional: 4, Broken: 1 },
        byAccessType: { Public: 4, Private: 1 },
    };

    it('FE-WS-037: should call GET /water-sources/stats', async () => {
        const api = mockApi(STATS);
        await getWaterSourceStats(api);

        expect(api.get).toHaveBeenCalledWith('/water-sources/stats');
    });

    it('FE-WS-038: should return the stats payload', async () => {
        const api = mockApi(STATS);
        const result = await getWaterSourceStats(api);

        expect(result).toEqual(STATS);
    });

    it('FE-WS-039: should propagate errors from the API', async () => {
        const api = {
            get: vi.fn().mockRejectedValue(new Error('Server Error')),
        };
        await expect(getWaterSourceStats(api)).rejects.toThrow('Server Error');
    });
});
