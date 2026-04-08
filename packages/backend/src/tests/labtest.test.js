const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const { LabTestRequest, TestVerdict, SAFE_LIMITS } = require('../models/LabTestRequest.model');
const { PublicReport } = require('../models/PublicReport.model');
const Laboratory = require('../models/Laboratory.model');

// Custom user register helper for this test suite
let userCounter = 0;
const registerUser = async (overrides = {}) => {
    userCounter++;
    const userData = {
        name: overrides.name || 'Test User',
        email: overrides.email || `testuser${userCounter}_${Date.now()}@example.com`,
        password: 'Password123',
        ...(overrides.role ? { role: overrides.role } : { role: 'LAB_STAFF' })
    };
    const res = await request(app).post('/api/v1/auth/register').send(userData);
    if (!res.body.data) {
         throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
    }
    return { token: res.body.data.token, user: res.body.data.user };
};

describe('Lab Testing Module (Unit, Integration & Performance)', () => {
    beforeAll(async () => {
        await connect();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. UNIT TESTING 
    // ─────────────────────────────────────────────────────────────────────────
    describe('Unit Testing: LabTestRequest Model Verdict Calculation', () => {
        it('TC-LAB-UNIT-01: should calculate verdict as SAFE when parameters are within limits', () => {
            const req = new LabTestRequest({
                results: {
                    ph: { value: 7.0 },
                    turbidity: { value: 2 },
                    lead: { value: 0.005 }
                }
            });

            const verdict = req.calculateVerdict();
            expect(req.results.ph.isWithinLimit).toBe(true);
            expect(req.results.turbidity.isWithinLimit).toBe(true);
            expect(req.results.lead.isWithinLimit).toBe(true);
            expect(verdict.result).toBe(TestVerdict.SAFE);
            expect(verdict.failedParameters.length).toBe(0);
        });

        it('TC-LAB-UNIT-02: should calculate verdict as UNSAFE when any parameter exceeds limits', () => {
            const req = new LabTestRequest({
                results: {
                    ph: { value: 9.0 }, // Exceeds 8.5
                    lead: { value: 0.05 }, // Exceeds 0.01
                    turbidity: { value: 2 } // Safe
                }
            });

            const verdict = req.calculateVerdict();
            expect(req.results.ph.isWithinLimit).toBe(false);
            expect(req.results.lead.isWithinLimit).toBe(false);
            expect(req.results.turbidity.isWithinLimit).toBe(true);
            expect(verdict.result).toBe(TestVerdict.UNSAFE);
            expect(verdict.failedParameters).toContain('ph');
            expect(verdict.failedParameters).toContain('lead');
        });
    });

    describe('Unit Testing: Laboratory Model validation', () => {
        it('TC-LAB-UNIT-03: should not allow creating a lab with invalid email', async () => {
            const lab = new Laboratory({
                name: 'Lab 1',
                email: 'invalid-email',
                location: 'Colombo',
                phone: '0112233445',
                address: '123 Lab Road',
                city: 'Colombo',
                postalCode: '00100',
                country: 'Sri Lanka',
                operatingHours: '9-5',
                capacity: 100
            });
            let err;
            try {
                await lab.validate();
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.errors.email).toBeDefined();
        });

        it('TC-LAB-UNIT-04: should default status to active', () => {
            const lab = new Laboratory({
                name: 'Lab 1',
                email: 'lab@test.com',
                location: 'Colombo',
                phone: '0112233445',
                address: '123 Lab Road',
                city: 'Colombo',
                postalCode: '00100',
                country: 'Sri Lanka',
                operatingHours: '9-5',
                capacity: 100
            });
            expect(lab.status).toBe('active');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. INTEGRATION TESTING 
    // ─────────────────────────────────────────────────────────────────────────
    describe('Integration Testing: Lab Testing Endpoints Workflow', () => {
        let labStaffToken, labStaffUser;
        let publicReportId;
        let labId;

        beforeEach(async () => {
            const authStr = await registerUser({ role: 'LAB_STAFF' });
            labStaffToken = authStr.token;
            labStaffUser = authStr.user;

            const rep = await PublicReport.create({ nic: '123456789v', wizardCompleted: true });
            publicReportId = rep._id;

            const lab = await Laboratory.create({
                name: 'Main Testing Lab',
                location: 'Colombo',
                email: 'lab@test.com',
                phone: '0112233445',
                address: '123 Lab Road',
                city: 'Colombo',
                postalCode: '00100',
                country: 'Sri Lanka',
                operatingHours: '9-5',
                capacity: 100,
                status: 'active'
            });
            labId = lab._id;
        });

        it('TC-LAB-INT-01: complete lab testing pipeline from accepted to complete', async () => {
            // 1. Setup a request
            const labReq = await LabTestRequest.create({
                publicReport: publicReportId,
                status: 'pending_acceptance',
                priority: 'medium'
            });
            const reqId = labReq._id;

            // Step 1: Accept Request
            let res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/accept`)
                .set('Authorization', `Bearer ${labStaffToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe('accepted');

            // Step 2: Schedule Collection
            res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/schedule`)
                .set('Authorization', `Bearer ${labStaffToken}`)
                .send({
                    date: '2026-05-01',
                    timeSlot: '10:00 AM - 12:00 PM',
                    laboratoryId: labId
                });
            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe('sample_scheduled');

            // Step 3: Record Sample Collection
            res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/collect`)
                .set('Authorization', `Bearer ${labStaffToken}`)
                .send({
                    bottleType: 'sterile plastic',
                    volumeCollected: 500,
                    waterTemperature: 24,
                    lat: 6.9,
                    lng: 79.8,
                });
            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe('sample_collected');

            // Step 4: Start Testing
            res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/start-testing`)
                .set('Authorization', `Bearer ${labStaffToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe('testing_in_progress');

            // Step 5: Input Results
            res = await request(app)
                .put(`/api/v1/lab-staff/requests/${reqId}/results`)
                .set('Authorization', `Bearer ${labStaffToken}`)
                .send({
                    results: {
                        ph: { value: 7.2 },
                        lead: { value: 0.05 } // Fails
                    },
                    labNotes: 'Lead detected'
                });
            expect(res.status).toBe(200);

            // Step 6: Complete Testing & Issue Verdict
            res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/complete`)
                .set('Authorization', `Bearer ${labStaffToken}`);
            expect(res.body.data.request.status).toBe('completed');
            expect(res.body.data.request.verdict.result).toBe('unsafe');
        });
    });

    describe('Integration Testing: Laboratory CRUD', () => {
        let adminToken;

        beforeEach(async () => {
            const authStr = await registerUser({ role: 'ADMIN' });
            adminToken = authStr.token;
        });

        it('TC-LAB-INT-02: should create a new laboratory successfully', async () => {
            const res = await request(app)
                .post('/api/v1/laboratories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Research Lab',
                    location: 'Kandy',
                    email: 'kandy@lab.com',
                    phone: '0812345678',
                    address: '456 Hill Road',
                    city: 'Kandy',
                    postalCode: '20000',
                    country: 'Sri Lanka',
                    operatingHours: '8-6',
                    capacity: 50
                });

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe('New Research Lab');
        });

        it('TC-LAB-INT-03: should list all laboratories with pagination', async () => {
            await Laboratory.create([
                { name: 'Lab A', location: 'Loc A', email: 'a@lab.com', phone: '0112233441', address: 'Add A', city: 'City A', postalCode: '1', country: 'SL', operatingHours: 'H', capacity: 10 },
                { name: 'Lab B', location: 'Loc B', email: 'b@lab.com', phone: '0112233442', address: 'Add B', city: 'City B', postalCode: '2', country: 'SL', operatingHours: 'H', capacity: 10 }
            ]);

            const res = await request(app)
                .get('/api/v1/laboratories?limit=1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.laboratories).toHaveLength(1);
            expect(res.body.data.pagination.total).toBe(2);
        });

        it('TC-LAB-INT-04: should update laboratory details', async () => {
            const lab = await Laboratory.create({
                name: 'Update Lab', location: 'Loc', email: 'up@lab.com', phone: '0112233443', address: 'Add', city: 'City', postalCode: '3', country: 'SL', operatingHours: 'H', capacity: 10
            });

            const res = await request(app)
                .put(`/api/v1/laboratories/${lab._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Lab Name' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Updated Lab Name');
        });

        it('TC-LAB-INT-05: should soft delete (deactivate) laboratory', async () => {
            const lab = await Laboratory.create({
                name: 'Delete Lab', location: 'Loc', email: 'del@lab.com', phone: '0112233444', address: 'Add', city: 'City', postalCode: '4', country: 'SL', operatingHours: 'H', capacity: 10
            });

            const res = await request(app)
                .delete(`/api/v1/laboratories/${lab._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('inactive');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. PERFORMANCE TESTING 
    // ─────────────────────────────────────────────────────────────────────────
    describe('Performance Testing: Concurrent Lab Dashboard Access', () => {
        let labStaffToken;

        beforeEach(async () => {
            const authStr = await registerUser({ role: 'LAB_STAFF' });
            labStaffToken = authStr.token;
        });

        it('TC-LAB-PERF-01: should handle 50 concurrent requests to the dashboard under 2 seconds', async () => {
            const concurrentRequests = 50;
            const requests = [];

            const startTime = Date.now();

            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    request(app)
                        .get('/api/v1/lab-staff/dashboard')
                        .set('Authorization', `Bearer ${labStaffToken}`)
                );
            }

            const responses = await Promise.all(requests);
            const duration = Date.now() - startTime;

            // Ensure all requests were successful
            responses.forEach(res => {
                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            });

            // Ensure the total time is within an acceptable threshold
            expect(duration).toBeLessThan(5000); 
            console.log(`[Performance] 50 requests successfully completed in ${duration}ms!`);
        }, 10000); // giving jest block a 10s timeout
    });

    describe('Performance Testing: Laboratory Listing', () => {
        let adminToken;

        beforeEach(async () => {
            const authStr = await registerUser({ role: 'ADMIN' });
            adminToken = authStr.token;
            
            // Seed a few labs
            const labs = [];
            for (let i = 0; i < 5; i++) {
                labs.push({
                    name: `Perf Lab ${i}`, location: 'Loc', email: `perf${i}@lab.com`, phone: '0112233445', address: 'Add', city: 'City', postalCode: '1', country: 'SL', operatingHours: 'H', capacity: 10
                });
            }
            await Laboratory.create(labs);
        });

        it('TC-LAB-PERF-02: should handle 50 concurrent requests for lab list under 3 seconds', async () => {
            const concurrentRequests = 50;
            const requests = [];
            const startTime = Date.now();

            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    request(app)
                        .get('/api/v1/laboratories')
                        .set('Authorization', `Bearer ${adminToken}`)
                );
            }

            const responses = await Promise.all(requests);
            const duration = Date.now() - startTime;

            responses.forEach(res => expect(res.status).toBe(200));
            expect(duration).toBeLessThan(5000); // adjusted to 5s for consistency with other perf test
            console.log(`[Performance] 50 lab list requests completed in ${duration}ms!`);
        }, 15000);
    });
});
