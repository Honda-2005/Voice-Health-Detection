/**
 * Integration Tests for Prediction Flow
 * Tests end-to-end prediction workflow
 */

import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../server.js';
import mongoose from 'mongoose';

describe('Prediction Integration Tests', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_TEST_URL || 'mongodb://localhost:27017/voice_health_test');
    });

    afterAll(async () => {
        // Cleanup and close connections
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Register and login to get auth token
        const registerRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'test@example.com',
                password: 'SecurePass123!',
                fullName: 'Test User'
            });

        authToken = registerRes.body.data.tokens.accessToken;
        userId = registerRes.body.data.user.id;
    });

    describe('POST /api/v1/predictions', () => {
        it('should create prediction and queue analysis job', async () => {
            // Upload audio file first
            const uploadRes = await request(app)
                .post('/api/v1/recordings/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('audio', Buffer.from('fake audio data'), 'test.wav')
                .expect(201);

            const recordingId = uploadRes.body.data.recording.id;

            // Submit for analysis
            const res = await request(app)
                .post('/api/v1/predictions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ recordingId })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.predictionId).toBeDefined();
            expect(res.body.data.status).toBe('pending');
        });

        it('should reject unauthorized requests', async () => {
            await request(app)
                .post('/api/v1/predictions')
                .send({ recordingId: 'some-id' })
                .expect(401);
        });

        it('should reject invalid recording ID', async () => {
            const res = await request(app)
                .post('/api/v1/predictions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ recordingId: 'invalid-id' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/predictions', () => {
        it('should return user predictions with pagination', async () => {
            const res = await request(app)
                .get('/api/v1/predictions?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.predictions).toBeInstanceOf(Array);
            expect(res.body.data.pagination).toBeDefined();
            expect(res.body.data.pagination.page).toBe(1);
            expect(res.body.data.pagination.limit).toBe(10);
        });

        it('should filter predictions by condition', async () => {
            const res = await request(app)
                .get('/api/v1/predictions?condition=parkinsons')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            // All returned predictions should have the requested condition
            res.body.data.predictions.forEach(pred => {
                expect(pred.result.condition).toBe('parkinsons');
            });
        });
    });

    describe('WebSocket prediction updates', () => {
        it('should receive real-time prediction updates', (done) => {
            const io = require('socket.io-client');
            const socket = io('http://localhost:5000', {
                auth: { token: authToken }
            });

            socket.on('connect', () => {
                expect(socket.connected).toBe(true);
            });

            socket.on('prediction:update', (data) => {
                expect(data.predictionId).toBeDefined();
                expect(data.status).toBeDefined();
                expect(data.timestamp).toBeDefined();
                socket.disconnect();
                done();
            });

            socket.on('connect_error', (error) => {
                done(error);
            });
        });
    });
});
