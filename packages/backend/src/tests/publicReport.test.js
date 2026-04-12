const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const { PublicReport } = require('../models/PublicReport.model');
const BannedUser = require('../models/BannedUser.model');

describe('Public Report Module (Wizard)', () => {

    beforeAll(async () => {
        await connect();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('POST /api/v1/public-reports', () => {
        it('should create a new public report with valid NIC', async () => {
            const res = await request(app)
                .post('/api/v1/public-reports')
                .send({ nic: '987654321v' });

            expect(res.status).toBe(201);
            expect(res.body.data.report.nic).toBe('987654321v');
            expect(res.body.data.report.currentStep).toBe(1);
        });

        it('should block creation if the NIC is banned', async () => {
            await BannedUser.create({
                type: 'nic',
                value: '987654321v',
                bannedBy: new mongoose.Types.ObjectId()
            });

            const res = await request(app)
                .post('/api/v1/public-reports')
                .send({ nic: '987654321v' });

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('banned');
        });

        it('should validate NIC format', async () => {
            const res = await request(app)
                .post('/api/v1/public-reports')
                .send({ nic: 'invalid-nic' });
            
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/public-reports/:id', () => {
        it('should fetch an existing report by ID', async () => {
            const rp = await PublicReport.create({ nic: '111111111v' });
            
            const res = await request(app)
                .get(`/api/v1/public-reports/${rp._id}`);
                
            expect(res.status).toBe(200);
            expect(res.body.data.report._id.toString()).toBe(rp._id.toString());
        });
    });

    describe('GET /api/v1/public-reports/by-nic/:nic', () => {
        it('should return all reports associated with an NIC', async () => {
            await PublicReport.create([
                { nic: '222222222v', waterSource: 'river' },
                { nic: '222222222v', waterSource: 'well' },
                { nic: '333333333v', waterSource: 'lake' }
            ]);

            const res = await request(app)
                .get('/api/v1/public-reports/by-nic/222222222v');
            
            expect(res.status).toBe(200);
            expect(res.body.data.reports).toHaveLength(2);
        });
    });

    describe('PATCH /api/v1/public-reports/:id', () => {
        it('should update fields in an incomplete report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', currentStep: 1 });
            
            const res = await request(app)
                .patch(`/api/v1/public-reports/${rp._id}`)
                .send({
                    waterSource: 'lake',
                    location: {
                        district: 'Colombo',
                        city: 'Colombo 01',
                    },
                    currentStep: 2
                });

            expect(res.status).toBe(200);
            expect(res.body.data.report.waterSource).toBe('lake');
            expect(res.body.data.report.location.district).toBe('Colombo');
            expect(res.body.data.report.currentStep).toBe(2);
        });

        it('should not allow updating a completed report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', wizardCompleted: true });
            
            const res = await request(app)
                .patch(`/api/v1/public-reports/${rp._id}`)
                .send({
                    waterSource: 'river',
                });
                
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('completed report');
        });
    });

    describe('POST /api/v1/public-reports/:id/images', () => {
        it('should attach base64 images to a report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v' });
            
            const res = await request(app)
                .post(`/api/v1/public-reports/${rp._id}/images`)
                .send({
                    images: [
                        { imageType: 'water_source', data: 'data:image/png;base64,...', contentType: 'image/png' },
                        { imageType: 'water_sample', data: 'data:image/jpeg;base64,...', contentType: 'image/jpeg' }
                    ]
                });
                
            expect(res.status).toBe(200);
            expect(res.body.data.imageCount).toBe(2);
        });
        
        it('should reject more than 10 images', async () => {
            const rp = await PublicReport.create({ nic: '123456789v' });
            
            const dummyImages = Array.from({ length: 11 }, () => ({
                imageType: 'water_source', data: 'base64', contentType: 'image/png'
            }));

            const res = await request(app)
                .post(`/api/v1/public-reports/${rp._id}/images`)
                .send({ images: dummyImages });
                
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Maximum 10 images');
        });
    });

    describe('POST /api/v1/public-reports/:id/submit', () => {
        it('should finalize and complete a report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', wizardCompleted: false });
            
            const res = await request(app)
                .post(`/api/v1/public-reports/${rp._id}/submit`)
                .send();
                
            expect(res.status).toBe(200);
            expect(res.body.data.report.wizardCompleted).toBe(true);
            expect(res.body.data.report.mod_status).toBe('pending');
        });
        
        it('should prevent double submission', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', wizardCompleted: true });
            
            const res = await request(app)
                .post(`/api/v1/public-reports/${rp._id}/submit`)
                .send();
                
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/public-reports/:id/full', () => {
        it('should fetch the full details of a completed report', async () => {
            const rp = await PublicReport.create({ nic: '123456789v', wizardCompleted: true, waterSource: 'river' });
            rp.images.push({
               imageType: 'water_source',
               data: 'base64',
               contentType: 'image/png'
            });
            await rp.save();
            
            const res = await request(app)
                .get(`/api/v1/public-reports/${rp._id}/full`);
                
            expect(res.status).toBe(200);
            expect(res.body.data.report.waterSource).toBe('river');
             // Data payload shouldn't be included in full view, it maps to just metadata in controller:
            expect(res.body.data.report.images[0].data).toBeUndefined();
        });
    });

});
