/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  UNIT TESTS — waterSource.controller.js
 *
 *  Strategy: Use Jest manual mocks to isolate every controller function.
 *  No real database — WaterSource model is fully mocked, so tests run
 *  instantly without mongodb-memory-server.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Module mocks (must be before require) ────────────────────────────────────
jest.mock('../../models/WaterSource.model');
jest.mock('../../models/WaterTest.model', () => ({
    WaterTest: { find: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }) }) },
}));

const WaterSource = require('../../models/WaterSource.model');
const {
    createSource,
    getSources,
    getMySources,
    getNearbySources,
    getSourceById,
    updateSourceStatus,
    updateWaterSource,
    verifyWaterSource,
    softDeleteSource,
    getSourceStats,
} = require('../../controllers/waterSource.controller');

// ── Helpers: build mock req / res / next ─────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

/** Wraps asyncHandler-wrapped controllers so thrown errors reach `next` */
const callController = async (fn, req, res) => {
    try {
        await fn(req, res, mockNext);
    } catch (err) {
        mockNext(err);
    }
};

// ── Shared test data ──────────────────────────────────────────────────────────
const MOCK_USER_ID = '64a1b2c3d4e5f6a7b8c9d0e1';
const MOCK_SOURCE_ID = '64a1b2c3d4e5f6a7b8c9d0e2';

const baseReq = (overrides = {}) => ({
    user: { _id: MOCK_USER_ID, role: 'USER' },
    params: {},
    query: {},
    body: {},
    ...overrides,
});

const sampleSource = {
    _id: MOCK_SOURCE_ID,
    name: 'Community Well',
    type: 'Well',
    location: { type: 'Point', coordinates: [79.86, 6.93] },
    operational_status: 'Functional',
    access_type: 'Public',
    verified: false,
    is_deleted: false,
    created_by: MOCK_USER_ID,
    description: 'Test well',
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockResolvedValue({}),
    softDelete: jest.fn().mockResolvedValue(true),
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. createSource
// ═════════════════════════════════════════════════════════════════════════════
describe('createSource — Unit Tests', () => {
    const req = baseReq({
        body: {
            name: 'Community Well',
            type: 'Well',
            location: { latitude: 6.93, longitude: 79.86 },
            operational_status: 'Functional',
            access_type: 'Public',
            description: 'A test well',
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Fresh source mock for each test so .populate is a fresh jest.fn()
        const ws = { ...sampleSource, populate: jest.fn().mockResolvedValue(true), save: jest.fn().mockResolvedValue(true) };
        WaterSource.checkDuplicateNearby = jest.fn().mockResolvedValue(false);
        WaterSource.create = jest.fn().mockResolvedValue(ws);
    });

    it('UC-WS-001: should create a water source when no duplicate exists', async () => {
        const res = mockRes();
        await callController(createSource, req, res);

        expect(WaterSource.checkDuplicateNearby).toHaveBeenCalledWith(79.86, 6.93, 20);
        expect(WaterSource.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Community Well',
                type: 'Well',
                location: { type: 'Point', coordinates: [79.86, 6.93] },
                created_by: MOCK_USER_ID,
            })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('UC-WS-002: should throw 409 when duplicate water source exists within 20m', async () => {
        WaterSource.checkDuplicateNearby = jest.fn().mockResolvedValue(true);
        const res = mockRes();
        await callController(createSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 409 })
        );
        expect(WaterSource.create).not.toHaveBeenCalled();
    });

    it('UC-WS-003: should pass correct GeoJSON coordinate order [lng, lat]', async () => {
        const res = mockRes();
        await callController(createSource, req, res);

        expect(WaterSource.create).toHaveBeenCalledWith(
            expect.objectContaining({
                location: { type: 'Point', coordinates: [79.86, 6.93] }, // [lng, lat]
            })
        );
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. getSources
// ═════════════════════════════════════════════════════════════════════════════
describe('getSources — Unit Tests', () => {
    const mockFind = jest.fn();
    const mockCount = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // Chain: find().populate().populate().sort().limit().skip().lean()
        mockFind.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([sampleSource]),
        });
        mockCount.mockResolvedValue(1);
        WaterSource.find = mockFind;
        WaterSource.countDocuments = mockCount;
    });

    it('UC-WS-004: should always filter by is_deleted: false', async () => {
        const req = baseReq({ query: {} });
        const res = mockRes();
        await callController(getSources, req, res);

        expect(WaterSource.find).toHaveBeenCalledWith(
            expect.objectContaining({ is_deleted: false })
        );
    });

    it('UC-WS-005: should apply type filter when provided', async () => {
        const req = baseReq({ query: { type: 'Well' } });
        const res = mockRes();
        await callController(getSources, req, res);

        expect(WaterSource.find).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'Well' })
        );
    });

    it('UC-WS-006: should apply operational_status filter when provided', async () => {
        const req = baseReq({ query: { operational_status: 'Broken' } });
        const res = mockRes();
        await callController(getSources, req, res);

        expect(WaterSource.find).toHaveBeenCalledWith(
            expect.objectContaining({ operational_status: 'Broken' })
        );
    });

    it('UC-WS-007: should NOT apply type filter when not provided', async () => {
        const req = baseReq({ query: {} });
        const res = mockRes();
        await callController(getSources, req, res);

        const callArg = WaterSource.find.mock.calls[0][0];
        expect(callArg).not.toHaveProperty('type');
    });

    it('UC-WS-008: should return 200 with sources and pagination data', async () => {
        const req = baseReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        await callController(getSources, req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const jsonArg = res.json.mock.calls[0][0];
        expect(jsonArg.data).toHaveProperty('sources');
        expect(jsonArg.data).toHaveProperty('pagination');
        expect(jsonArg.data.pagination).toMatchObject({
            total: 1,
            page: 1,
            limit: 10,
        });
    });

    it('UC-WS-009: should calculate hasNextPage correctly', async () => {
        mockCount.mockResolvedValue(25);
        const req = baseReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        await callController(getSources, req, res);

        const { pagination } = res.json.mock.calls[0][0].data;
        expect(pagination.totalPages).toBe(3);
        expect(pagination.hasNextPage).toBe(true);
        expect(pagination.hasPrevPage).toBe(false);
    });

    it('UC-WS-010: should calculate hasPrevPage correctly on last page', async () => {
        mockCount.mockResolvedValue(25);
        const req = baseReq({ query: { page: '3', limit: '10' } });
        const res = mockRes();
        await callController(getSources, req, res);

        const { pagination } = res.json.mock.calls[0][0].data;
        expect(pagination.hasNextPage).toBe(false);
        expect(pagination.hasPrevPage).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. getMySources
// ═════════════════════════════════════════════════════════════════════════════
describe('getMySources — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        WaterSource.find = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        });
        WaterSource.countDocuments = jest.fn().mockResolvedValue(0);
    });

    it('UC-WS-011: should filter by current user ID', async () => {
        const req = baseReq({ query: {} });
        const res = mockRes();
        await callController(getMySources, req, res);

        expect(WaterSource.find).toHaveBeenCalledWith(
            expect.objectContaining({ created_by: MOCK_USER_ID })
        );
    });

    it('UC-WS-012: should also include is_deleted: false filter', async () => {
        const req = baseReq({ query: {} });
        const res = mockRes();
        await callController(getMySources, req, res);

        expect(WaterSource.find).toHaveBeenCalledWith(
            expect.objectContaining({ is_deleted: false, created_by: MOCK_USER_ID })
        );
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. getNearbySources
// ═════════════════════════════════════════════════════════════════════════════
describe('getNearbySources — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        WaterSource.findNearby = jest.fn().mockResolvedValue([sampleSource]);
    });

    it('UC-WS-013: should call findNearby with correct parsed values', async () => {
        const req = baseReq({
            query: { latitude: '6.93', longitude: '79.86', radius: '3000' },
        });
        const res = mockRes();
        await callController(getNearbySources, req, res);

        expect(WaterSource.findNearby).toHaveBeenCalledWith(79.86, 6.93, 3000, {});
    });

    it('UC-WS-014: should use default radius of 5000m when not specified', async () => {
        const req = baseReq({
            query: { latitude: '6.93', longitude: '79.86' },
        });
        const res = mockRes();
        await callController(getNearbySources, req, res);

        expect(WaterSource.findNearby).toHaveBeenCalledWith(79.86, 6.93, 5000, {});
    });

    it('UC-WS-015: should pass type filter to findNearby', async () => {
        const req = baseReq({
            query: { latitude: '6.93', longitude: '79.86', type: 'Well' },
        });
        const res = mockRes();
        await callController(getNearbySources, req, res);

        expect(WaterSource.findNearby).toHaveBeenCalledWith(
            79.86, 6.93, 5000, { type: 'Well' }
        );
    });

    it('UC-WS-016: should return count and center in response', async () => {
        const req = baseReq({
            query: { latitude: '6.93', longitude: '79.86' },
        });
        const res = mockRes();
        await callController(getNearbySources, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('count', 1);
        expect(data.center).toEqual({ latitude: 6.93, longitude: 79.86 });
        expect(data).toHaveProperty('radius', 5000);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. getSourceById
// ═════════════════════════════════════════════════════════════════════════════
describe('getSourceById — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        WaterSource.findOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(sampleSource),
        });
    });

    it('UC-WS-017: should return water source when found', async () => {
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(getSourceById, req, res);

        expect(WaterSource.findOne).toHaveBeenCalledWith({
            _id: MOCK_SOURCE_ID,
            is_deleted: false,
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('UC-WS-018: should throw 404 when water source not found', async () => {
        WaterSource.findOne = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        });
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(getSourceById, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404, message: 'Water source not found' })
        );
    });

    it('UC-WS-019: should include recentReports in response', async () => {
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(getSourceById, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('recentReports');
        expect(Array.isArray(data.recentReports)).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. updateSourceStatus
// ═════════════════════════════════════════════════════════════════════════════
describe('updateSourceStatus — Unit Tests', () => {
    let mockSource;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSource = {
            ...sampleSource,
            operational_status: 'Functional',
            description: 'Original description',
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockResolvedValue(true),
        };
        WaterSource.findOne = jest.fn().mockResolvedValue(mockSource);
    });

    it('UC-WS-020: should update operational status', async () => {
        const req = baseReq({
            params: { id: MOCK_SOURCE_ID },
            body: { operational_status: 'Broken' },
        });
        const res = mockRes();
        await callController(updateSourceStatus, req, res);

        expect(mockSource.operational_status).toBe('Broken');
        expect(mockSource.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('UC-WS-021: should append notes to description when provided', async () => {
        const req = baseReq({
            params: { id: MOCK_SOURCE_ID },
            body: { operational_status: 'Maintenance', notes: 'Pump repair needed' },
        });
        const res = mockRes();
        await callController(updateSourceStatus, req, res);

        expect(mockSource.description).toContain('Pump repair needed');
        expect(mockSource.description).toContain('Maintenance');
    });

    it('UC-WS-022: should throw 404 if source not found', async () => {
        WaterSource.findOne = jest.fn().mockResolvedValue(null);
        const req = baseReq({
            params: { id: MOCK_SOURCE_ID },
            body: { operational_status: 'Broken' },
        });
        const res = mockRes();
        await callController(updateSourceStatus, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404 })
        );
    });

    it('UC-WS-023: should include previous status in response message', async () => {
        const req = baseReq({
            params: { id: MOCK_SOURCE_ID },
            body: { operational_status: 'Broken' },
        });
        const res = mockRes();
        await callController(updateSourceStatus, req, res);

        const { message } = res.json.mock.calls[0][0];
        expect(message).toContain('Functional'); // previous status
        expect(message).toContain('Broken');     // new status
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. updateWaterSource
// ═════════════════════════════════════════════════════════════════════════════
describe('updateWaterSource — Unit Tests', () => {
    let mockSource;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSource = {
            ...sampleSource,
            created_by: { toString: () => MOCK_USER_ID },
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockResolvedValue(true),
        };
        WaterSource.findOne = jest.fn().mockResolvedValue(mockSource);
    });

    it('UC-WS-024: should allow the creator to update', async () => {
        const req = baseReq({
            user: { _id: MOCK_USER_ID, role: 'USER' },
            params: { id: MOCK_SOURCE_ID },
            body: { name: 'Updated Name' },
        });
        const res = mockRes();
        await callController(updateWaterSource, req, res);

        expect(mockSource.name).toBe('Updated Name');
        expect(mockSource.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('UC-WS-025: should throw 403 if user is not creator and not moderator', async () => {
        const differentUserId = '64a1b2c3d4e5f6a7b8c9d0e9';
        const req = baseReq({
            user: { _id: differentUserId, role: 'USER' },
            params: { id: MOCK_SOURCE_ID },
            body: { name: 'Hacked Name' },
        });
        const res = mockRes();
        await callController(updateWaterSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 403 })
        );
        expect(mockSource.save).not.toHaveBeenCalled();
    });

    it('UC-WS-026: should allow MODERATOR to update any source', async () => {
        const differentUserId = '64a1b2c3d4e5f6a7b8c9d0e9';
        const req = baseReq({
            user: { _id: differentUserId, role: 'MODERATOR' },
            params: { id: MOCK_SOURCE_ID },
            body: { name: 'Mod Updated' },
        });
        const res = mockRes();
        await callController(updateWaterSource, req, res);

        expect(mockSource.save).toHaveBeenCalledTimes(1);
    });

    it('UC-WS-027: should allow ADMIN to update any source', async () => {
        const differentUserId = '64a1b2c3d4e5f6a7b8c9d0e9';
        const req = baseReq({
            user: { _id: differentUserId, role: 'ADMIN' },
            params: { id: MOCK_SOURCE_ID },
            body: { description: 'Admin update' },
        });
        const res = mockRes();
        await callController(updateWaterSource, req, res);

        expect(mockSource.save).toHaveBeenCalledTimes(1);
    });

    it('UC-WS-028: should only update allowed fields (whitelist)', async () => {
        const req = baseReq({
            user: { _id: MOCK_USER_ID, role: 'USER' },
            params: { id: MOCK_SOURCE_ID },
            body: { name: 'Good', is_deleted: true, verified: true }, // is_deleted/verified should be blocked
        });
        const originalVerified = mockSource.verified;
        const originalDeleted = mockSource.is_deleted;
        const res = mockRes();
        await callController(updateWaterSource, req, res);

        expect(mockSource.name).toBe('Good');
        expect(mockSource.verified).toBe(originalVerified);   // Must not change
        expect(mockSource.is_deleted).toBe(originalDeleted); // Must not change
    });

    it('UC-WS-029: should throw 404 if source does not exist', async () => {
        WaterSource.findOne = jest.fn().mockResolvedValue(null);
        const req = baseReq({
            params: { id: MOCK_SOURCE_ID },
            body: { name: 'Test' },
        });
        const res = mockRes();
        await callController(updateWaterSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404 })
        );
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. verifyWaterSource
// ═════════════════════════════════════════════════════════════════════════════
describe('verifyWaterSource — Unit Tests', () => {
    let mockSource;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSource = {
            ...sampleSource,
            verified: false,
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockResolvedValue(true),
        };
        WaterSource.findOne = jest.fn().mockResolvedValue(mockSource);
    });

    it('UC-WS-030: should set verified to true', async () => {
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(verifyWaterSource, req, res);

        expect(mockSource.verified).toBe(true);
        expect(mockSource.verified_by).toBe(MOCK_USER_ID);
        expect(mockSource.save).toHaveBeenCalledTimes(1);
    });

    it('UC-WS-031: should set verified_at timestamp', async () => {
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(verifyWaterSource, req, res);

        expect(mockSource.verified_at).toBeInstanceOf(Date);
    });

    it('UC-WS-032: should throw 400 if source is already verified', async () => {
        mockSource.verified = true;
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(verifyWaterSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400, message: 'Water source is already verified' })
        );
        expect(mockSource.save).not.toHaveBeenCalled();
    });

    it('UC-WS-033: should throw 404 if source not found', async () => {
        WaterSource.findOne = jest.fn().mockResolvedValue(null);
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(verifyWaterSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404 })
        );
    });

    it('UC-WS-034: should return 200 with verified source data', async () => {
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(verifyWaterSource, req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const { message } = res.json.mock.calls[0][0];
        expect(message).toBe('Water source verified successfully');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. softDeleteSource
// ═════════════════════════════════════════════════════════════════════════════
describe('softDeleteSource — Unit Tests', () => {
    let mockSource;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSource = {
            ...sampleSource,
            created_by: { toString: () => MOCK_USER_ID },
            softDelete: jest.fn().mockResolvedValue(true),
        };
        WaterSource.findOne = jest.fn().mockResolvedValue(mockSource);
    });

    it('UC-WS-035: should soft-delete when user is creator', async () => {
        const req = baseReq({
            user: { _id: MOCK_USER_ID, role: 'USER' },
            params: { id: MOCK_SOURCE_ID },
        });
        const res = mockRes();
        await callController(softDeleteSource, req, res);

        expect(mockSource.softDelete).toHaveBeenCalledWith(MOCK_USER_ID);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('UC-WS-036: should throw 403 if non-creator, non-moderator tries to delete', async () => {
        const differentUserId = '64a1b2c3d4e5f6a7b8c9d0e9';
        const req = baseReq({
            user: { _id: differentUserId, role: 'USER' },
            params: { id: MOCK_SOURCE_ID },
        });
        const res = mockRes();
        await callController(softDeleteSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 403 })
        );
        expect(mockSource.softDelete).not.toHaveBeenCalled();
    });

    it('UC-WS-037: should allow ADMIN to delete any source', async () => {
        const adminId = '64a1b2c3d4e5f6a7b8c9d0e9';
        const req = baseReq({
            user: { _id: adminId, role: 'ADMIN' },
            params: { id: MOCK_SOURCE_ID },
        });
        const res = mockRes();
        await callController(softDeleteSource, req, res);

        expect(mockSource.softDelete).toHaveBeenCalledTimes(1);
    });

    it('UC-WS-038: should throw 404 when source not found', async () => {
        WaterSource.findOne = jest.fn().mockResolvedValue(null);
        const req = baseReq({ params: { id: MOCK_SOURCE_ID } });
        const res = mockRes();
        await callController(softDeleteSource, req, res);

        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 404 })
        );
    });

    it('UC-WS-039: should return deleted source id in response', async () => {
        const req = baseReq({
            user: { _id: MOCK_USER_ID, role: 'USER' },
            params: { id: MOCK_SOURCE_ID },
        });
        const res = mockRes();
        await callController(softDeleteSource, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data).toHaveProperty('id', MOCK_SOURCE_ID);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. getSourceStats
// ═════════════════════════════════════════════════════════════════════════════
describe('getSourceStats — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('UC-WS-040: should return zero stats when aggregate returns empty', async () => {
        WaterSource.aggregate = jest.fn().mockResolvedValue([]);
        const req = baseReq();
        const res = mockRes();
        await callController(getSourceStats, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data.total).toBe(0);
        expect(data.verified).toBe(0);
        expect(data.byType).toEqual({});
    });

    it('UC-WS-041: should compute unverified as total minus verified', async () => {
        WaterSource.aggregate = jest.fn().mockResolvedValue([{
            total: 10,
            verified: 3,
            byType: ['Well', 'Well', 'River'],
            byStatus: ['Functional', 'Broken', 'Functional'],
            byAccessType: ['Public', 'Private', 'Public'],
        }]);
        const req = baseReq();
        const res = mockRes();
        await callController(getSourceStats, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data.unverified).toBe(7);
    });

    it('UC-WS-042: should count types correctly', async () => {
        WaterSource.aggregate = jest.fn().mockResolvedValue([{
            total: 3,
            verified: 0,
            byType: ['Well', 'Well', 'River'],
            byStatus: ['Functional', 'Functional', 'Functional'],
            byAccessType: ['Public', 'Public', 'Public'],
        }]);
        const req = baseReq();
        const res = mockRes();
        await callController(getSourceStats, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data.byType).toEqual({ Well: 2, River: 1 });
    });

    it('UC-WS-043: should count statuses correctly', async () => {
        WaterSource.aggregate = jest.fn().mockResolvedValue([{
            total: 3,
            verified: 0,
            byType: ['Well', 'Well', 'River'],
            byStatus: ['Functional', 'Broken', 'Functional'],
            byAccessType: ['Public', 'Public', 'Public'],
        }]);
        const req = baseReq();
        const res = mockRes();
        await callController(getSourceStats, req, res);

        const { data } = res.json.mock.calls[0][0];
        expect(data.byStatus).toEqual({ Functional: 2, Broken: 1 });
    });

    it('UC-WS-044: should use $match is_deleted: false in aggregate pipeline', async () => {
        WaterSource.aggregate = jest.fn().mockResolvedValue([]);
        const req = baseReq();
        const res = mockRes();
        await callController(getSourceStats, req, res);

        const pipeline = WaterSource.aggregate.mock.calls[0][0];
        expect(pipeline[0]).toEqual({ $match: { is_deleted: false } });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. ApiError — Unit Tests
// ═════════════════════════════════════════════════════════════════════════════
describe('ApiError — Unit Tests', () => {
    const ApiError = require('../../utils/ApiError');

    it('UC-ERR-001: should create error with correct statusCode and message', () => {
        const err = new ApiError(404, 'Not Found');
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Not Found');
        expect(err.isOperational).toBe(true);
    });

    it('UC-ERR-002: should set status to "fail" for 4xx errors', () => {
        const err = new ApiError(400, 'Bad');
        expect(err.status).toBe('fail');
    });

    it('UC-ERR-003: should set status to "error" for 5xx errors', () => {
        const err = new ApiError(500, 'Server Error');
        expect(err.status).toBe('error');
    });

    it('UC-ERR-004: static notFound() should create 404 error', () => {
        const err = ApiError.notFound('Water source not found');
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Water source not found');
    });

    it('UC-ERR-005: static conflict() should create 409 error', () => {
        const err = ApiError.conflict('Duplicate entry');
        expect(err.statusCode).toBe(409);
    });

    it('UC-ERR-006: static forbidden() should create 403 error', () => {
        const err = ApiError.forbidden('No permission');
        expect(err.statusCode).toBe(403);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. ApiResponse — Unit Tests
// ═════════════════════════════════════════════════════════════════════════════
describe('ApiResponse — Unit Tests', () => {
    const ApiResponse = require('../../utils/ApiResponse');

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('UC-RES-001: success() should send 200 with success: true', () => {
        const res = mockRes();
        ApiResponse.success(res, { foo: 'bar' }, 'OK');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: 'OK' })
        );
    });

    it('UC-RES-002: created() should send 201', () => {
        const res = mockRes();
        ApiResponse.created(res, { id: 1 }, 'Created');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, statusCode: 201 })
        );
    });

    it('UC-RES-003: error() should send specified status code with success: false', () => {
        const res = mockRes();
        ApiResponse.error(res, 422, 'Validation failed');
        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: 'Validation failed' })
        );
    });

    it('UC-RES-004: response should include timestamp', () => {
        const res = mockRes();
        ApiResponse.success(res, {});
        const { timestamp } = res.json.mock.calls[0][0];
        expect(new Date(timestamp).toString()).not.toBe('Invalid Date');
    });
});
