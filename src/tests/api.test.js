const request = require('supertest');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const { User } = require('../models/User.model');

describe('Health Check Endpoints', () => {
    beforeAll(async () => {
        await connect();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('GET /api/v1/health', () => {
        it('should return healthy status', async () => {
            const res = await request(app)
                .get('/api/v1/health')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('healthy');
            expect(res.body.data.mongodb).toBe('connected');
        });
    });

    describe('GET /api/v1/', () => {
        it('should return API info', async () => {
            const res = await request(app)
                .get('/api/v1/')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Water Quality Report API');
            expect(res.body.data.version).toBe('1.0.0');
        });
    });
});

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        await connect();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('POST /api/v1/auth/register', () => {
        const validUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123',
        };

        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('User registered successfully');
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user.email).toBe(validUser.email);
            expect(res.body.data.user.name).toBe(validUser.name);
            expect(res.body.data.user.role).toBe('USER');
            expect(res.body.data).toHaveProperty('token');
        });

        it('should not register user with existing email', async () => {
            // Create user first
            await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            // Try to register again with same email
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser)
                .expect(409);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email already registered');
        });

        it('should fail with missing name', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'test@example.com', password: 'Password123' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Validation failed');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'name' }),
                ])
            );
        });

        it('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Test', email: 'invalid-email', password: 'Password123' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'email' }),
                ])
            );
        });

        it('should fail with weak password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Test', email: 'test@example.com', password: 'weak' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'password' }),
                ])
            );
        });

        it('should fail with password missing uppercase letter', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Test', email: 'test@example.com', password: 'password123' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should register user with custom role', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ ...validUser, role: 'MODERATOR' })
                .expect(201);

            expect(res.body.data.user.role).toBe('MODERATOR');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        const validUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123',
        };

        beforeEach(async () => {
            // Register a user before each login test
            await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);
        });

        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: validUser.email, password: validUser.password })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login successful');
            expect(res.body.data.user.email).toBe(validUser.email);
            expect(res.body.data).toHaveProperty('token');
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: validUser.email, password: 'WrongPassword123' })
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should fail with non-existent email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'Password123' })
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should fail with missing email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ password: 'Password123' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Validation failed');
        });

        it('should fail with missing password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: validUser.email })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        let authToken;
        const validUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123',
        };

        beforeEach(async () => {
            // Register and get token
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);
            authToken = res.body.data.token;
        });

        it('should return user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(validUser.email);
            expect(res.body.data.user.name).toBe(validUser.name);
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Access denied. No token provided.');
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });
});

describe('User Endpoints', () => {
    let userToken;
    let adminToken;

    beforeAll(async () => {
        await connect();
    });

    beforeEach(async () => {
        // Create a regular user
        const userRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Regular User',
                email: 'user@example.com',
                password: 'Password123',
            });
        userToken = userRes.body.data.token;

        // Create an admin user
        const adminRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'Password123',
                role: 'ADMIN',
            });
        adminToken = adminRes.body.data.token;
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('GET /api/v1/users/profile', () => {
        it('should return user profile', async () => {
            const res = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('user@example.com');
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .get('/api/v1/users/profile')
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/users', () => {
        it('should allow admin to list all users', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.users).toBeInstanceOf(Array);
            expect(res.body.data.pagination).toHaveProperty('total');
        });

        it('should deny regular user access to list users', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(res.body.success).toBe(false);
            expect(res.body.statusCode).toBe(403);
        });
    });
});

describe('Admin Endpoints', () => {
    let userToken;
    let adminToken;
    let userId;

    beforeAll(async () => {
        await connect();
    });

    beforeEach(async () => {
        // Create a regular user
        const userRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Regular User',
                email: 'user@example.com',
                password: 'Password123',
            });
        userToken = userRes.body.data.token;
        userId = userRes.body.data.user.id;

        // Create an admin user
        const adminRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'Password123',
                role: 'ADMIN',
            });
        adminToken = adminRes.body.data.token;
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('GET /api/v1/admin/dashboard', () => {
        it('should return dashboard stats for admin', async () => {
            const res = await request(app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.stats).toHaveProperty('totalUsers');
            expect(res.body.data.stats).toHaveProperty('activeUsers');
            expect(res.body.data.stats).toHaveProperty('usersByRole');
        });

        it('should deny regular user access', async () => {
            const res = await request(app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('ADMIN');
        });
    });

    describe('GET /api/v1/admin/users', () => {
        it('should return paginated users for admin', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.users).toBeInstanceOf(Array);
            expect(res.body.data.pagination).toMatchObject({
                page: 1,
                limit: 10,
            });
        });

        it('should filter users by role', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users?role=ADMIN')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.data.users.every(u => u.role === 'ADMIN')).toBe(true);
        });
    });

    describe('PATCH /api/v1/admin/users/:userId/role', () => {
        it('should update user role', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/users/${userId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'MODERATOR' })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.user.role).toBe('MODERATOR');
        });

        it('should fail with invalid role', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/users/${userId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'INVALID_ROLE' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should deny non-admin user', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/users/${userId}/role`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ role: 'ADMIN' })
                .expect(403);

            expect(res.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/admin/users/:userId/status', () => {
        it('should deactivate user', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/users/${userId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.user.isActive).toBe(false);
        });

        it('should activate user', async () => {
            // First deactivate
            await request(app)
                .patch(`/api/v1/admin/users/${userId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });

            // Then activate
            const res = await request(app)
                .patch(`/api/v1/admin/users/${userId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: true })
                .expect(200);

            expect(res.body.data.user.isActive).toBe(true);
        });

        it('should fail with non-boolean isActive', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/users/${userId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: 'not-a-boolean' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });
});

describe('Error Handling', () => {
    beforeAll(async () => {
        await connect();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('404 Not Found', () => {
        it('should return 404 for non-existent routes', async () => {
            const res = await request(app)
                .get('/api/v1/non-existent-route')
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.statusCode).toBe(404);
            expect(res.body.message).toContain('not found');
        });
    });
});
