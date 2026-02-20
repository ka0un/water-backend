const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const WaterSource = require('../models/WaterSource.model');

// ─── Helper: Register a user and return token ───────────────────────────────
let userCounter = 0;
const registerUser = async (overrides = {}) => {
    userCounter++;
    const userData = {
        name: overrides.name || 'Test User',
        email: overrides.email || `testuser${userCounter}_${Date.now()}@example.com`,
        password: 'Password123',
        ...(overrides.role ? { role: overrides.role } : {}),
    };
    const res = await request(app).post('/api/v1/auth/register').send(userData);
    if (!res.body.data) {
        throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
    }
    return { token: res.body.data.token, user: res.body.data.user };
};

// ─── Helper: Create a water source via API ──────────────────────────────────
const createWaterSource = async (token, overrides = {}) => {
    const sourceData = {
        name: 'Community Well #1',
        type: 'Well',
        location: { latitude: 6.9271, longitude: 79.8612 },
        operational_status: 'Functional',
        access_type: 'Public',
        description: 'Main well serving the area',
        ...overrides,
    };
    return request(app)
        .post('/api/v1/water-sources')
        .set('Authorization', `Bearer ${token}`)
        .send(sourceData);
};

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═════════════════════════════════════════════════════════════════════════════

describe('Water Source Module', () => {
    beforeAll(async () => {
        await connect();
        // Ensure the 2dsphere index is created for geospatial queries
        await WaterSource.createIndexes();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. POST /api/v1/water-sources — Create Water Source
    // ─────────────────────────────────────────────────────────────────────────
    describe('POST /api/v1/water-sources', () => {
        it('TC-WS-001: should create a water source successfully', async () => {
            const { token } = await registerUser();

            const res = await createWaterSource(token);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Water source created successfully');
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.name).toBe('Community Well #1');
            expect(res.body.data.type).toBe('Well');
            expect(res.body.data.location.type).toBe('Point');
            expect(res.body.data.location.coordinates).toEqual([79.8612, 6.9271]);
            expect(res.body.data.operational_status).toBe('Functional');
            expect(res.body.data.access_type).toBe('Public');
            expect(res.body.data.verified).toBe(false);
            expect(res.body.data.created_by).toHaveProperty('name');
        });

        it('TC-WS-002: should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/v1/water-sources')
                .send({
                    name: 'Test Well',
                    type: 'Well',
                    location: { latitude: 6.9271, longitude: 79.8612 },
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-003: should fail with missing required fields (name)', async () => {
            const { token } = await registerUser();

            const res = await request(app)
                .post('/api/v1/water-sources')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    type: 'Well',
                    location: { latitude: 6.9271, longitude: 79.8612 },
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Validation failed');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'name' }),
                ])
            );
        });

        it('TC-WS-004: should fail with invalid water source type', async () => {
            const { token } = await registerUser();

            const res = await createWaterSource(token, { type: 'InvalidType' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'type' }),
                ])
            );
        });

        it('TC-WS-005: should fail with invalid coordinates (latitude out of range)', async () => {
            const { token } = await registerUser();

            const res = await createWaterSource(token, {
                location: { latitude: 100, longitude: 79.8612 },
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-006: should fail with invalid coordinates (longitude out of range)', async () => {
            const { token } = await registerUser();

            const res = await createWaterSource(token, {
                location: { latitude: 6.9271, longitude: 200 },
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-007: should fail with missing location', async () => {
            const { token } = await registerUser();

            const res = await request(app)
                .post('/api/v1/water-sources')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Test Well', type: 'Well' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-008: should detect duplicate within 20 meters', async () => {
            const { token } = await registerUser();

            // Create first source
            const first = await createWaterSource(token, {
                name: 'Well A',
                location: { latitude: 6.9271, longitude: 79.8612 },
            });
            expect(first.status).toBe(201);

            // Create source at nearly same location (within 20m)
            const res = await createWaterSource(token, {
                name: 'Well B',
                location: { latitude: 6.9271, longitude: 79.8612 },
            });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already exists within 20 meters');
        });

        it('TC-WS-009: should allow source creation at distant location', async () => {
            const { token } = await registerUser();

            // Create first source
            await createWaterSource(token, {
                name: 'Well A',
                location: { latitude: 6.9271, longitude: 79.8612 },
            });

            // Create source at a different location (far from first)
            const res = await createWaterSource(token, {
                name: 'Well B',
                location: { latitude: 7.2906, longitude: 80.6337 },
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('TC-WS-010: should create source with all valid types', async () => {
            const { token } = await registerUser();
            const types = ['Well', 'Public Tap', 'River', 'Lake', 'Bowser Point'];

            for (let i = 0; i < types.length; i++) {
                const res = await createWaterSource(token, {
                    name: `Source Type ${types[i]}`,
                    type: types[i],
                    location: { latitude: 6.0 + i * 0.5, longitude: 80.0 + i * 0.5 },
                });
                expect(res.status).toBe(201);
                expect(res.body.data.type).toBe(types[i]);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. GET /api/v1/water-sources — List Water Sources
    // ─────────────────────────────────────────────────────────────────────────
    describe('GET /api/v1/water-sources', () => {
        it('TC-WS-011: should return empty list when no sources exist', async () => {
            const res = await request(app).get('/api/v1/water-sources');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sources).toEqual([]);
            expect(res.body.data.pagination.total).toBe(0);
        });

        it('TC-WS-012: should return all water sources', async () => {
            const { token } = await registerUser();
            await createWaterSource(token, { name: 'Well 1', location: { latitude: 6.0, longitude: 80.0 } });
            await createWaterSource(token, { name: 'Well 2', location: { latitude: 7.0, longitude: 81.0 } });

            const res = await request(app).get('/api/v1/water-sources');

            expect(res.status).toBe(200);
            expect(res.body.data.sources).toHaveLength(2);
            expect(res.body.data.pagination.total).toBe(2);
        });

        it('TC-WS-013: should filter by type', async () => {
            const { token } = await registerUser();
            await createWaterSource(token, { name: 'Well', type: 'Well', location: { latitude: 6.0, longitude: 80.0 } });
            await createWaterSource(token, { name: 'River', type: 'River', location: { latitude: 7.0, longitude: 81.0 } });

            const res = await request(app).get('/api/v1/water-sources?type=Well');

            expect(res.status).toBe(200);
            expect(res.body.data.sources).toHaveLength(1);
            expect(res.body.data.sources[0].type).toBe('Well');
        });

        it('TC-WS-014: should filter by operational status', async () => {
            const { token } = await registerUser();
            await createWaterSource(token, { name: 'Working Well', operational_status: 'Functional', location: { latitude: 6.0, longitude: 80.0 } });
            await createWaterSource(token, { name: 'Broken Well', operational_status: 'Broken', location: { latitude: 7.0, longitude: 81.0 } });

            const res = await request(app).get('/api/v1/water-sources?operational_status=Broken');

            expect(res.status).toBe(200);
            expect(res.body.data.sources).toHaveLength(1);
            expect(res.body.data.sources[0].operational_status).toBe('Broken');
        });

        it('TC-WS-015: should support pagination', async () => {
            const { token } = await registerUser();
            for (let i = 0; i < 5; i++) {
                await createWaterSource(token, {
                    name: `Well ${i}`,
                    location: { latitude: 6.0 + i * 0.5, longitude: 80.0 + i * 0.5 },
                });
            }

            const res = await request(app).get('/api/v1/water-sources?page=1&limit=2');

            expect(res.status).toBe(200);
            expect(res.body.data.sources).toHaveLength(2);
            expect(res.body.data.pagination.total).toBe(5);
            expect(res.body.data.pagination.totalPages).toBe(3);
            expect(res.body.data.pagination.hasNextPage).toBe(true);
            expect(res.body.data.pagination.hasPrevPage).toBe(false);
        });

        it('TC-WS-016: should not return soft-deleted sources', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`);

            const res = await request(app).get('/api/v1/water-sources');

            expect(res.status).toBe(200);
            expect(res.body.data.sources).toHaveLength(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. GET /api/v1/water-sources/nearby — Nearby Search
    // ─────────────────────────────────────────────────────────────────────────
    describe('GET /api/v1/water-sources/nearby', () => {
        it('TC-WS-017: should find nearby water sources', async () => {
            const { token } = await registerUser();
            await createWaterSource(token, {
                name: 'Colombo Well',
                location: { latitude: 6.9271, longitude: 79.8612 },
            });

            const res = await request(app)
                .get('/api/v1/water-sources/nearby?latitude=6.9271&longitude=79.8612&radius=5000');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.sources.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.radius).toBe(5000);
        });

        it('TC-WS-018: should return empty when no sources within radius', async () => {
            const { token } = await registerUser();
            await createWaterSource(token, {
                name: 'Colombo Well',
                location: { latitude: 6.9271, longitude: 79.8612 },
            });

            // Search near Jaffna (very far)
            const res = await request(app)
                .get('/api/v1/water-sources/nearby?latitude=9.6615&longitude=80.0255&radius=1000');

            expect(res.status).toBe(200);
            expect(res.body.data.sources).toHaveLength(0);
        });

        it('TC-WS-019: should fail without required coordinates', async () => {
            const res = await request(app)
                .get('/api/v1/water-sources/nearby');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-020: should fail with radius exceeding maximum', async () => {
            const res = await request(app)
                .get('/api/v1/water-sources/nearby?latitude=6.9271&longitude=79.8612&radius=100000');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. GET /api/v1/water-sources/:id — Get By ID
    // ─────────────────────────────────────────────────────────────────────────
    describe('GET /api/v1/water-sources/:id', () => {
        it('TC-WS-021: should return a water source by ID', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app).get(`/api/v1/water-sources/${sourceId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(sourceId);
            expect(res.body.data.name).toBe('Community Well #1');
            expect(res.body.data.created_by).toHaveProperty('name');
        });

        it('TC-WS-022: should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).get(`/api/v1/water-sources/${fakeId}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Water source not found');
        });

        it('TC-WS-023: should return 400 for invalid ID format', async () => {
            const res = await request(app).get('/api/v1/water-sources/invalid-id');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-024: should not return soft-deleted source', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`);

            const res = await request(app).get(`/api/v1/water-sources/${sourceId}`);

            expect(res.status).toBe(404);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. PATCH /api/v1/water-sources/:id/status — Update Status
    // ─────────────────────────────────────────────────────────────────────────
    describe('PATCH /api/v1/water-sources/:id/status', () => {
        it('TC-WS-025: should update operational status', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ operational_status: 'Broken', notes: 'Pump not working' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.operational_status).toBe('Broken');
            expect(res.body.message).toContain('Functional');
            expect(res.body.message).toContain('Broken');
        });

        it('TC-WS-026: should fail with invalid operational status', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ operational_status: 'InvalidStatus' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-027: should fail without authentication', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/status`)
                .send({ operational_status: 'Broken' });

            expect(res.status).toBe(401);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. PATCH /api/v1/water-sources/:id — Update Details
    // ─────────────────────────────────────────────────────────────────────────
    describe('PATCH /api/v1/water-sources/:id', () => {
        it('TC-WS-028: should allow creator to update source details', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Well Name', description: 'Updated description' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Updated Well Name');
            expect(res.body.data.description).toBe('Updated description');
        });

        it('TC-WS-029: should deny non-creator, non-moderator from updating', async () => {
            const { token: creatorToken } = await registerUser();
            const { token: otherToken } = await registerUser();

            const createRes = await createWaterSource(creatorToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ name: 'Hacked Name' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('permission');
        });

        it('TC-WS-030: should allow moderator to update any source', async () => {
            const { token: creatorToken } = await registerUser();
            const { token: modToken } = await registerUser({ role: 'MODERATOR' });

            const createRes = await createWaterSource(creatorToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${modToken}`)
                .send({ name: 'Moderator Updated Name' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Moderator Updated Name');
        });

        it('TC-WS-031: should fail with empty update body', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. PATCH /api/v1/water-sources/:id/verify — Verify Source
    // ─────────────────────────────────────────────────────────────────────────
    describe('PATCH /api/v1/water-sources/:id/verify', () => {
        it('TC-WS-032: should allow moderator to verify a source', async () => {
            const { token: userToken } = await registerUser();
            const { token: modToken } = await registerUser({ role: 'MODERATOR' });

            const createRes = await createWaterSource(userToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/verify`)
                .set('Authorization', `Bearer ${modToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.verified).toBe(true);
            expect(res.body.data.verified_by).toHaveProperty('name');
            expect(res.body.message).toBe('Water source verified successfully');
        });

        it('TC-WS-033: should allow admin to verify a source', async () => {
            const { token: userToken } = await registerUser();
            const { token: adminToken } = await registerUser({ role: 'ADMIN' });

            const createRes = await createWaterSource(userToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/verify`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.verified).toBe(true);
        });

        it('TC-WS-034: should deny regular user from verifying', async () => {
            const { token: userToken } = await registerUser();

            const createRes = await createWaterSource(userToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/verify`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-035: should fail if source is already verified', async () => {
            const { token: userToken } = await registerUser();
            const { token: modToken } = await registerUser({ role: 'MODERATOR' });

            const createRes = await createWaterSource(userToken);
            const sourceId = createRes.body.data._id;

            // Verify once
            await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/verify`)
                .set('Authorization', `Bearer ${modToken}`);

            // Attempt to verify again
            const res = await request(app)
                .patch(`/api/v1/water-sources/${sourceId}/verify`)
                .set('Authorization', `Bearer ${modToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('already verified');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. DELETE /api/v1/water-sources/:id — Soft Delete
    // ─────────────────────────────────────────────────────────────────────────
    describe('DELETE /api/v1/water-sources/:id', () => {
        it('TC-WS-036: should allow creator to soft delete source', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Water source deleted successfully');
            expect(res.body.data.id).toBe(sourceId);

            // Verify it no longer appears in GET
            const getRes = await request(app).get(`/api/v1/water-sources/${sourceId}`);
            expect(getRes.status).toBe(404);
        });

        it('TC-WS-037: should deny non-creator, non-moderator from deleting', async () => {
            const { token: creatorToken } = await registerUser();
            const { token: otherToken } = await registerUser();

            const createRes = await createWaterSource(creatorToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('TC-WS-038: should allow admin to delete any source', async () => {
            const { token: userToken } = await registerUser();
            const { token: adminToken } = await registerUser({ role: 'ADMIN' });

            const createRes = await createWaterSource(userToken);
            const sourceId = createRes.body.data._id;

            const res = await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('TC-WS-039: should return 404 for already-deleted source', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            // Delete once
            await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`);

            // Try deleting again
            const res = await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 9. GET /api/v1/water-sources/stats — Statistics
    // ─────────────────────────────────────────────────────────────────────────
    describe('GET /api/v1/water-sources/stats', () => {
        it('TC-WS-040: should return zero stats when no sources exist', async () => {
            const res = await request(app).get('/api/v1/water-sources/stats');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.total).toBe(0);
        });

        it('TC-WS-041: should return correct statistics', async () => {
            const { token } = await registerUser();
            await createWaterSource(token, {
                name: 'Well 1',
                type: 'Well',
                access_type: 'Public',
                location: { latitude: 6.0, longitude: 80.0 },
            });
            await createWaterSource(token, {
                name: 'River 1',
                type: 'River',
                access_type: 'Public',
                location: { latitude: 7.0, longitude: 81.0 },
            });
            await createWaterSource(token, {
                name: 'Lake 1',
                type: 'Lake',
                access_type: 'Private',
                operational_status: 'Broken',
                location: { latitude: 8.0, longitude: 82.0 },
            });

            const res = await request(app).get('/api/v1/water-sources/stats');

            expect(res.status).toBe(200);
            expect(res.body.data.total).toBe(3);
            expect(res.body.data.verified).toBe(0);
            expect(res.body.data.unverified).toBe(3);
            expect(res.body.data.byType).toEqual(
                expect.objectContaining({ Well: 1, River: 1, Lake: 1 })
            );
            expect(res.body.data.byStatus).toEqual(
                expect.objectContaining({ Functional: 2, Broken: 1 })
            );
            expect(res.body.data.byAccessType).toEqual(
                expect.objectContaining({ Public: 2, Private: 1 })
            );
        });

        it('TC-WS-042: should not count soft-deleted sources in stats', async () => {
            const { token } = await registerUser();
            const createRes = await createWaterSource(token);
            const sourceId = createRes.body.data._id;

            await request(app)
                .delete(`/api/v1/water-sources/${sourceId}`)
                .set('Authorization', `Bearer ${token}`);

            const res = await request(app).get('/api/v1/water-sources/stats');

            expect(res.status).toBe(200);
            expect(res.body.data.total).toBe(0);
        });
    });
});
