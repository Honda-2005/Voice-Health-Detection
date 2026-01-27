import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Recording from '../../backend/models/Recording.js';
import User from '../../backend/models/User.js';
import bcrypt from 'bcryptjs';

let testUser;
let testUserId;

// Connect to test database
beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/voice_health_test';
    await mongoose.connect(mongoUri);

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    testUser = await User.create({
        email: 'recording-test@example.com',
        password: hashedPassword,
        fullName: 'Recording Test User',
        role: 'user'
    });
    testUserId = testUser._id;
});

// Clean up after each test
beforeEach(async () => {
    await Recording.deleteMany({ userId: testUserId });
});

// Disconnect after tests
afterAll(async () => {
    await Recording.deleteMany({ userId: testUserId });
    await User.deleteOne({ _id: testUserId });
    await mongoose.disconnect();
});

describe('Recording Tests', () => {
    describe('Recording Creation', () => {
        test('should create recording with valid data', async () => {
            const recording = new Recording({
                userId: testUserId,
                audioFile: {
                    fileId: new mongoose.Types.ObjectId().toString(),
                    filename: 'test-recording.wav',
                    contentType: 'audio/wav',
                    size: 1024000,
                    duration: 15
                },
                metadata: {
                    sampleRate: 44100,
                    channels: 1,
                    bitDepth: 16,
                    format: 'wav'
                },
                status: 'pending'
            });

            const savedRecording = await recording.save();

            expect(savedRecording._id).toBeDefined();
            expect(savedRecording.userId.toString()).toBe(testUserId.toString());
            expect(savedRecording.audioFile.filename).toBe('test-recording.wav');
            expect(savedRecording.status).toBe('pending');
            expect(savedRecording.createdAt).toBeDefined();
        });

        test('should require userId', async () => {
            const recording = new Recording({
                audioFile: {
                    fileId: new mongoose.Types.ObjectId().toString(),
                    filename: 'test.wav',
                    contentType: 'audio/wav',
                    size: 1024,
                    duration: 10
                }
            });

            await expect(recording.save()).rejects.toThrow();
        });

        test('should validate recording status', async () => {
            const recording = new Recording({
                userId: testUserId,
                audioFile: {
                    fileId: new mongoose.Types.ObjectId().toString(),
                    filename: 'test.wav',
                    contentType: 'audio/wav',
                    size: 1024,
                    duration: 10
                },
                status: 'invalid-status'
            });

            await expect(recording.save()).rejects.toThrow();
        });

        test('should accept valid status values', async () => {
            const statuses = ['pending', 'processing', 'completed', 'failed'];

            for (const status of statuses) {
                const recording = new Recording({
                    userId: testUserId,
                    audioFile: {
                        fileId: new mongoose.Types.ObjectId().toString(),
                        filename: `test-${status}.wav`,
                        contentType: 'audio/wav',
                        size: 1024,
                        duration: 10
                    },
                    status
                });

                const saved = await recording.save();
                expect(saved.status).toBe(status);
            }
        });
    });

    describe('Recording Queries', () => {
        beforeEach(async () => {
            // Create test recordings
            await Recording.create([
                {
                    userId: testUserId,
                    audioFile: {
                        fileId: new mongoose.Types.ObjectId().toString(),
                        filename: 'recording-1.wav',
                        contentType: 'audio/wav',
                        size: 1024,
                        duration: 10
                    },
                    status: 'completed'
                },
                {
                    userId: testUserId,
                    audioFile: {
                        fileId: new mongoose.Types.ObjectId().toString(),
                        filename: 'recording-2.wav',
                        contentType: 'audio/wav',
                        size: 2048,
                        duration: 20
                    },
                    status: 'pending'
                },
                {
                    userId: testUserId,
                    audioFile: {
                        fileId: new mongoose.Types.ObjectId().toString(),
                        filename: 'recording-3.wav',
                        contentType: 'audio/wav',
                        size: 3072,
                        duration: 30
                    },
                    status: 'completed'
                }
            ]);
        });

        test('should find all recordings for user', async () => {
            const recordings = await Recording.find({ userId: testUserId });
            expect(recordings).toHaveLength(3);
        });

        test('should filter recordings by status', async () => {
            const completedRecordings = await Recording.find({
                userId: testUserId,
                status: 'completed'
            });

            expect(completedRecordings).toHaveLength(2);
            completedRecordings.forEach(rec => {
                expect(rec.status).toBe('completed');
            });
        });

        test('should sort recordings by creation date', async () => {
            const recordings = await Recording.find({ userId: testUserId })
                .sort({ createdAt: -1 });

            expect(recordings).toHaveLength(3);
            // Most recent first
            expect(recordings[0].audioFile.filename).toBe('recording-3.wav');
        });

        test('should update recording status', async () => {
            const recording = await Recording.findOne({
                userId: testUserId,
                status: 'pending'
            });

            recording.status = 'processing';
            const updated = await recording.save();

            expect(updated.status).toBe('processing');
        });

        test('should delete recording', async () => {
            const recording = await Recording.findOne({ userId: testUserId });
            const recordingId = recording._id;

            await Recording.deleteOne({ _id: recordingId });

            const deleted = await Recording.findById(recordingId);
            expect(deleted).toBeNull();
        });
    });

    describe('Recording Statistics', () => {
        beforeEach(async () => {
            await Recording.create([
                {
                    userId: testUserId,
                    audioFile: { fileId: new mongoose.Types.ObjectId().toString(), filename: 'r1.wav', contentType: 'audio/wav', size: 1000, duration: 10 },
                    status: 'completed'
                },
                {
                    userId: testUserId,
                    audioFile: { fileId: new mongoose.Types.ObjectId().toString(), filename: 'r2.wav', contentType: 'audio/wav', size: 2000, duration: 20 },
                    status: 'completed'
                },
                {
                    userId: testUserId,
                    audioFile: { fileId: new mongoose.Types.ObjectId().toString(), filename: 'r3.wav', contentType: 'audio/wav', size: 3000, duration: 30 },
                    status: 'pending'
                }
            ]);
        });

        test('should count total recordings', async () => {
            const count = await Recording.countDocuments({ userId: testUserId });
            expect(count).toBe(3);
        });

        test('should calculate total duration', async () => {
            const result = await Recording.aggregate([
                { $match: { userId: testUserId } },
                { $group: { _id: null, totalDuration: { $sum: '$audioFile.duration' } } }
            ]);

            expect(result[0].totalDuration).toBe(60);
        });

        test('should calculate average file size', async () => {
            const result = await Recording.aggregate([
                { $match: { userId: testUserId } },
                { $group: { _id: null, avgSize: { $avg: '$audioFile.size' } } }
            ]);

            expect(result[0].avgSize).toBe(2000);
        });

        test('should group by status', async () => {
            const result = await Recording.aggregate([
                { $match: { userId: testUserId } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            expect(result).toHaveLength(2);
            const statusCounts = Object.fromEntries(result.map(r => [r._id, r.count]));
            expect(statusCounts.completed).toBe(2);
            expect(statusCounts.pending).toBe(1);
        });
    });

    describe('Recording Metadata', () => {
        test('should store audio metadata', async () => {
            const recording = new Recording({
                userId: testUserId,
                audioFile: {
                    fileId: new mongoose.Types.ObjectId().toString(),
                    filename: 'metadata-test.wav',
                    contentType: 'audio/wav',
                    size: 1024,
                    duration: 10
                },
                metadata: {
                    sampleRate: 48000,
                    channels: 2,
                    bitDepth: 24,
                    format: 'flac'
                }
            });

            const saved = await recording.save();

            expect(saved.metadata.sampleRate).toBe(48000);
            expect(saved.metadata.channels).toBe(2);
            expect(saved.metadata.bitDepth).toBe(24);
            expect(saved.metadata.format).toBe('flac');
        });

        test('should add notes to recording', async () => {
            const recording = await Recording.create({
                userId: testUserId,
                audioFile: {
                    fileId: new mongoose.Types.ObjectId().toString(),
                    filename: 'notes-test.wav',
                    contentType: 'audio/wav',
                    size: 1024,
                    duration: 10
                },
                notes: 'Morning recording, felt good'
            });

            expect(recording.notes).toBe('Morning recording, felt good');
        });
    });
});
