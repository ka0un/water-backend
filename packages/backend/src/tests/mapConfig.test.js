const request = require('supertest');
const app = require('../app');

describe('Map Config Module', () => {
    describe('GET /api/v1/config/map-key', () => {
        let originalApiKey;

        beforeAll(() => {
            originalApiKey = process.env.Google_Map_apiKey;
        });

        afterAll(() => {
            process.env.Google_Map_apiKey = originalApiKey;
        });

        it('should return Google Maps API key if set', async () => {
            process.env.Google_Map_apiKey = 'test-api-key-123';

            const res = await request(app).get('/api/v1/config/map-key');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.apiKey).toBe('test-api-key-123');
        });

        it('should return an empty string if API key is not set', async () => {
            delete process.env.Google_Map_apiKey;

            const res = await request(app).get('/api/v1/config/map-key');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.apiKey).toBe('');
        });
    });
});
