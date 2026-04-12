const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const { LabTestRequest, LabTestStatus } = require('../models/LabTestRequest.model');
const { PublicReport } = require('../models/PublicReport.model');
const { User } = require('../models/User.model');
const Laboratory = require('../models/Laboratory.model');

describe('Lab Staff Module', () => {
    let labStaffToken;
    let labStaffId;
    let labId;
    let reportId;

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
        // Create Lab Staff User
        const password = 'Password123!';
        const staff = await User.create({
            name: 'Lab Tech',
            email: `tech_${Date.now()}@lab.com`,
            password,
            role: 'LAB_STAFF'
        });
        labStaffId = staff._id;

        // Login to get token
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: staff.email, password });
        labStaffToken = res.body.data.token;

        // Create a Laboratory
        const lab = await Laboratory.create({
            name: 'Central Water Lab',
            status: 'active',
            location: 'Colombo',
            email: 'lab@central.com',
            phone: '0112345678',
            address: '123 Test St',
            city: 'Colombo',
            postalCode: '00100',
            country: 'Sri Lanka',
            operatingHours: '9am - 5pm',
            capacity: 50
        });
        labId = lab._id.toString();

        // Create a basic PublicReport to link to requests
        const rp = await PublicReport.create({ nic: '123456789v', wizardCompleted: true });
        reportId = rp._id;
    });

    describe('GET /api/v1/lab-staff/dashboard', () => {
        it('should return aggregation statistics correctly', async () => {
            // Seed Requests
            await LabTestRequest.create([
                { publicReport: reportId, status: LabTestStatus.PENDING_ACCEPTANCE },
                { publicReport: reportId, status: LabTestStatus.ACCEPTED },
                { publicReport: reportId, status: LabTestStatus.TESTING_IN_PROGRESS },
                { publicReport: reportId, status: LabTestStatus.COMPLETED, testing: { completedAt: new Date() } }
            ]);

            const res = await request(app)
                .get('/api/v1/lab-staff/dashboard')
                .set('Authorization', `Bearer ${labStaffToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.data.stats).toBeDefined();
            expect(res.body.data.stats.pendingAcceptance).toBe(1);
            expect(res.body.data.stats.accepted).toBe(1);
            expect(res.body.data.stats.inProgress).toBe(1);
            expect(res.body.data.stats.completedToday).toBe(1);
            expect(res.body.data.stats.totalCompleted).toBe(1);
        });
    });

    describe('GET /api/v1/lab-staff/laboratories', () => {
        it('should return active laboratories', async () => {
            const res = await request(app)
                .get('/api/v1/lab-staff/laboratories')
                .set('Authorization', `Bearer ${labStaffToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.laboratories).toHaveLength(1);
            expect(res.body.data.laboratories[0].name).toBe('Central Water Lab');
        });
    });

    describe('GET /api/v1/lab-staff/requests', () => {
        it('should fetch a list of lab test requests', async () => {
            await LabTestRequest.create({ publicReport: reportId, status: LabTestStatus.PENDING_ACCEPTANCE });
            
            const res = await request(app)
                .get('/api/v1/lab-staff/requests')
                .set('Authorization', `Bearer ${labStaffToken}`);
                
            expect(res.status).toBe(200);
            expect(res.body.data.requests).toHaveLength(1);
        });
    });

    describe('GET /api/v1/lab-staff/safe-limits', () => {
        it('should return safe limits reference mapping', async () => {
            const res = await request(app)
                .get('/api/v1/lab-staff/safe-limits')
                .set('Authorization', `Bearer ${labStaffToken}`);
                
            expect(res.status).toBe(200);
            expect(res.body.data.safeLimits).toBeDefined();
            expect(res.body.data.safeLimits.ph).toBeDefined();
        });
    });

    describe('Lab Test Lifecycle Actions', () => {
        let reqId;

        beforeEach(async () => {
            const tr = await LabTestRequest.create({ publicReport: reportId });
            reqId = tr._id;
        });

        it('should fetch an individual request details', async () => {
            const res = await request(app)
                .get(`/api/v1/lab-staff/requests/${reqId}`)
                .set('Authorization', `Bearer ${labStaffToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.request._id.toString()).toBe(reqId.toString());
        });

        it('should accept a pending request', async () => {
            const res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/accept`)
                .set('Authorization', `Bearer ${labStaffToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe(LabTestStatus.ACCEPTED);
        });

        it('should reject a pending request', async () => {
            const res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/reject`)
                .set('Authorization', `Bearer ${labStaffToken}`)
                .send({ reason: 'Not enough info' });

            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe(LabTestStatus.REJECTED);
        });

        it('should schedule collection after acceptance', async () => {
             // Accept first
             await LabTestRequest.findByIdAndUpdate(reqId, { status: LabTestStatus.ACCEPTED });

             const res = await request(app)
                 .post(`/api/v1/lab-staff/requests/${reqId}/schedule`)
                 .set('Authorization', `Bearer ${labStaffToken}`)
                 .send({
                     date: new Date().toISOString(),
                     timeSlot: 'Morning',
                     laboratoryId: labId
                 });
             
             expect(res.status).toBe(200);
             expect(res.body.data.request.status).toBe(LabTestStatus.SAMPLE_SCHEDULED);
        });

        it('should record sample collection', async () => {
             // Schedule first
             await LabTestRequest.findByIdAndUpdate(reqId, { status: LabTestStatus.SAMPLE_SCHEDULED });

             const res = await request(app)
                 .post(`/api/v1/lab-staff/requests/${reqId}/collect`)
                 .set('Authorization', `Bearer ${labStaffToken}`)
                 .send({
                     lat: 6.9, lng: 79.8,
                     bottleType: 'Plastic',
                     volumeCollected: 500,
                     waterTemperature: 25.5
                 });

             expect(res.status).toBe(200);
             expect(res.body.data.request.status).toBe(LabTestStatus.SAMPLE_COLLECTED);
        });

        it('should start testing', async () => {
            // Collect first
            await LabTestRequest.findByIdAndUpdate(reqId, { status: LabTestStatus.SAMPLE_COLLECTED });
            
            const res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/start-testing`)
                .set('Authorization', `Bearer ${labStaffToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe(LabTestStatus.TESTING_IN_PROGRESS);
        });

        it('should input test results', async () => {
            await LabTestRequest.findByIdAndUpdate(reqId, { status: LabTestStatus.TESTING_IN_PROGRESS });

            const res = await request(app)
                .put(`/api/v1/lab-staff/requests/${reqId}/results`)
                .set('Authorization', `Bearer ${labStaffToken}`)
                .send({
                    results: {
                        ph: { value: 7.2 },
                        lead: { value: 0.05, notes: 'above limit' }
                    },
                    labNotes: 'Tested using kit Y'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.request.results.ph.value).toBe(7.2);
            expect(res.body.data.request.results.lead.value).toBe(0.05);
        });

        it('should complete testing and issue verdict automatically', async () => {
            // Setup testing in progress with results
            await LabTestRequest.findByIdAndUpdate(reqId, { 
                status: LabTestStatus.TESTING_IN_PROGRESS,
                results: {
                    ph: { value: 7.0 },
                    lead: { value: 0.001 } // safe
                }
            });

            const res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/complete`)
                .set('Authorization', `Bearer ${labStaffToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.request.status).toBe(LabTestStatus.COMPLETED);
            expect(res.body.data.request.verdict.result).toBe('safe'); // because all values safe
        });
        
        it('should issue unsafe verdict when parameters fail', async () => {
            // Setup testing in progress with results
            await LabTestRequest.findByIdAndUpdate(reqId, { 
                status: LabTestStatus.TESTING_IN_PROGRESS,
                results: {
                    ph: { value: 4.0 }, // Failed ph < 6.5
                    lead: { value: 5.0 } // Failed lead > 0.01
                }
            });

            const res = await request(app)
                .post(`/api/v1/lab-staff/requests/${reqId}/complete`)
                .set('Authorization', `Bearer ${labStaffToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.request.verdict.result).toBe('unsafe');
            expect(res.body.data.request.verdict.failedParameters).toContain('ph');
            expect(res.body.data.request.verdict.failedParameters).toContain('lead');
        });
    });
});
