const request = require('supertest');
const app = require('../../app');
const { connect, clearDatabase, closeDatabase } = require('../setup');
const WaterSource = require('../../models/WaterSource.model');

let userCounter = 0;

const registerUser = async (overrides = {}) => {
    userCounter += 1;

    const payload = {
        name: overrides.name || `User ${userCounter}`,
        email: overrides.email || `mine_user_${userCounter}_${Date.now()}@example.com`,
        password: 'Password123',
        ...(overrides.role ? { role: overrides.role } : {}),
    };

    const response = await request(app).post('/api/v1/auth/register').send(payload);

    return {
        token: response.body.data.token,
        user: response.body.data.user,
    };
};

const createSource = (token, payload) =>
    request(app)
        .post('/api/v1/water-sources')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

describe('Water source integration tests - /mine endpoint', () => {
    beforeAll(async () => {
        await connect();
        await WaterSource.createIndexes();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    it('returns 401 when user is not authenticated', async () => {
        const response = await request(app).get('/api/v1/water-sources/mine');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('returns only sources created by the current user', async () => {
        const { token: ownerToken } = await registerUser();
        const { token: otherToken } = await registerUser();

        await createSource(ownerToken, {
            name: 'Owner Source 1',
            type: 'Well',
            location: { latitude: 6.9211, longitude: 79.8512 },
        });

        await createSource(ownerToken, {
            name: 'Owner Source 2',
            type: 'River',
            location: { latitude: 7.251, longitude: 80.751 },
        });

        await createSource(otherToken, {
            name: 'Other User Source',
            type: 'Lake',
            location: { latitude: 8.123, longitude: 81.345 },
        });

        const response = await request(app)
            .get('/api/v1/water-sources/mine')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sources).toHaveLength(2);
        expect(response.body.data.sources.map((s) => s.name).sort()).toEqual([
            'Owner Source 1',
            'Owner Source 2',
        ]);
    });

    it('supports filters and pagination for current user inventory', async () => {
        const { token } = await registerUser();

        await createSource(token, {
            name: 'Mine Functional 1',
            type: 'Well',
            operational_status: 'Functional',
            location: { latitude: 6.0, longitude: 80.0 },
        });

        await createSource(token, {
            name: 'Mine Functional 2',
            type: 'Well',
            operational_status: 'Functional',
            location: { latitude: 6.5, longitude: 80.5 },
        });

        await createSource(token, {
            name: 'Mine Broken',
            type: 'Well',
            operational_status: 'Broken',
            location: { latitude: 7.0, longitude: 81.0 },
        });

        const response = await request(app)
            .get('/api/v1/water-sources/mine?type=Well&operational_status=Functional&page=1&limit=1')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sources).toHaveLength(1);
        expect(response.body.data.pagination.total).toBe(2);
        expect(response.body.data.pagination.totalPages).toBe(2);
    });
});
