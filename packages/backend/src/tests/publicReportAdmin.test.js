const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const { PublicReport } = require('../models/PublicReport.model');
const BannedUser = require('../models/BannedUser.model');

// Custom user register helper for this test suite
let userCounter = 0;
const registerUser = async (overrides = {}) => {
    userCounter++;
    const userData = {
        name: overrides.name || 'Admin User',
        email: overrides.email || `admin${userCounter}_${Date.now()}@example.com`,
        password: 'Password123',
        role: overrides.role || 'ADMIN'
    };
    const res = await request(app).post('/api/v1/auth/register').send(userData);
    if (!res.body.data) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
    return { token: res.body.data.token, user: res.body.data.user };
};

describe('Public Report Admin Module', () => {
    let adminToken, moderatorToken, userToken;

    beforeAll(async () => {
        await connect();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    beforeEach(async () => {
        const adminAuth = await registerUser({ role: 'ADMIN' });
        adminToken = adminAuth.token;

        const modAuth = await registerUser({ role: 'MODERATOR' });
        moderatorToken = modAuth.token;

        const userAuth = await registerUser({ role: 'USER' });
        userToken = userAuth.token;
    });

    describe('GET /api/v1/public-reports-admin', () => {
        it('should return a paginated list of reports for Admins', async () => {
            await PublicReport.create([
                { nic: '123456789v', mod_status: 'pending', incidentType: 'leak', location: { coordinates: [79.8, 6.9] }, wizardCompleted: true },
                { nic: '987654321v', mod_status: 'approved', incidentType: 'contamination', location: { coordinates: [79.8, 6.9] }, wizardCompleted: true }
            ]);

            const res = await request(app)
                .get('/api/v1/public-reports-admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.reports).toHaveLength(2);
            expect(res.body.data.pagination.total).toBe(2);
        });

        it('should filter reports by status', async () => {
            await PublicReport.create([
                { nic: '123456789v', mod_status: 'pending', wizardCompleted: true },
                { nic: '987654321v', mod_status: 'approved', wizardCompleted: true }
            ]);

            const res = await request(app)
                .get('/api/v1/public-reports-admin?status=approved')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.reports).toHaveLength(1);
            expect(res.body.data.reports[0].mod_status).toBe('approved');
        });

        it('should deny access to regular users', async () => {
            const res = await request(app)
                .get('/api/v1/public-reports-admin')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/v1/public-reports-admin/stats', () => {
        it('should return aggregation statistics', async () => {
             await PublicReport.create([
                { nic: '123456789v', mod_status: 'pending', riskLevel: 'high', wizardCompleted: true },
                { nic: '987654321v', mod_status: 'approved', riskLevel: 'low', wizardCompleted: true }
            ]);

            const res = await request(app)
                .get('/api/v1/public-reports-admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.overview).toBeDefined();
            expect(res.body.data.overview.total).toBe(2);
        });
    });

    describe('GET /api/v1/public-reports-admin/export', () => {
        it('should export reports as JSON', async () => {
             await PublicReport.create({ nic: '123456789v', mod_status: 'pending', wizardCompleted: true });

             const res = await request(app)
                .get('/api/v1/public-reports-admin/export')
                .set('Authorization', `Bearer ${adminToken}`);

             expect(res.status).toBe(200);
             expect(res.headers['content-type']).toContain('application/json');
             expect(res.body.reports).toBeInstanceOf(Array);
             expect(res.body.reports.length).toBe(1);
        });
    });

    describe('POST /api/v1/public-reports-admin/ban and unban', () => {
        it('should ban an IP/NIC and then unban it', async () => {
            const banRes = await request(app)
                .post('/api/v1/public-reports-admin/ban')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    value: '111222333v',
                    type: 'nic',
                    reason: 'Spamming reports',
                    durationHours: 24
                });
            expect(banRes.status).toBe(201);
            expect(banRes.body.data.ban.type).toBe('nic');

            const unbanRes = await request(app)
                .post('/api/v1/public-reports-admin/unban')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    value: '111222333v',
                    type: 'nic'
                });
            expect(unbanRes.status).toBe(200);
            expect(unbanRes.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/public-reports-admin/:id/security', () => {
        it('should return security context for a report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', reporterIp: '127.0.0.1', wizardCompleted: true });
            
            const res = await request(app)
                .get(`/api/v1/public-reports-admin/${rp._id}/security`)
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(res.status).toBe(200);
            expect(res.body.data.security).toBeDefined();
        });
    });

    describe('GET /api/v1/public-reports-admin/:id', () => {
        it('should get detail of a public report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', mod_status: 'pending', wizardCompleted: true });
            const res = await request(app)
                .get(`/api/v1/public-reports-admin/${rp._id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.report._id.toString()).toBe(rp._id.toString());
        });
    });

    describe('PATCH /api/v1/public-reports-admin/:id/moderate', () => {
        it('should moderate a report using a moderator account', async () => {
             const rp = await PublicReport.create({ nic: '123456789v', mod_status: 'pending', wizardCompleted: true });
             
             const res = await request(app)
                .patch(`/api/v1/public-reports-admin/${rp._id}/moderate`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    action: 'approve',
                    reason: 'Looks good'
                });
            
             expect(res.status).toBe(200);
             expect(res.body.data.report.mod_status).toBe('approved');
        });
    });

    describe('Admin Only Operations', () => {
        it('should override report details (PATCH /:id)', async () => {
             const rp = await PublicReport.create({ nic: '123456789v', mod_status: 'pending', wizardCompleted: true, waterSource: 'well' });
             
             const res = await request(app)
                .patch(`/api/v1/public-reports-admin/${rp._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ waterSource: 'river' });
             expect(res.status).toBe(200);
             expect(res.body.data.report.waterSource).toBe('river');
        });

        it('should soft delete a single report (DELETE /:id)', async () => {
             const rp = await PublicReport.create({ nic: '123456789v', mod_status: 'pending', wizardCompleted: true });
             const res = await request(app)
                .delete(`/api/v1/public-reports-admin/${rp._id}`)
                .set('Authorization', `Bearer ${adminToken}`);
             expect(res.status).toBe(200);
             expect(res.body.data.deletedAt).toBeDefined();
        });

        it('should delete all reports by NIC (DELETE /by-nic/:nic)', async () => {
             await PublicReport.create([
                 { nic: '1234v', wizardCompleted: true },
                 { nic: '1234v', wizardCompleted: true }
             ]);
             const res = await request(app)
                .delete(`/api/v1/public-reports-admin/by-nic/1234v`)
                .set('Authorization', `Bearer ${adminToken}`);
             expect(res.status).toBe(200);
             expect(res.body.data.deletedCount).toBeGreaterThanOrEqual(2);
        });

        it('should truncate all reports (POST /reset)', async () => {
             await PublicReport.create({ nic: '222v', wizardCompleted: true });
             const res = await request(app)
                .post(`/api/v1/public-reports-admin/reset`)
                .set('Authorization', `Bearer ${adminToken}`);
             expect(res.status).toBe(200);
             
             const count = await PublicReport.countDocuments();
             expect(count).toBe(0);
        });
    });
});
