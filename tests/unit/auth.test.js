import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../backend/models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Test data
const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    fullName: 'Test User',
    phone: '+1234567890'
};

// Connect to test database
beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/voice_health_test';
    await mongoose.connect(mongoUri);
    // Clean up any existing test data
    await User.deleteMany({ email: testUser.email });
});

// Disconnect after tests
afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await mongoose.disconnect();
});

describe('Authentication Tests', () => {
    describe('User Registration', () => {
        test('should hash password correctly', async () => {
            const hashedPassword = await bcrypt.hash(testUser.password, 10);
            const isMatch = await bcrypt.compare(testUser.password, hashedPassword);

            expect(isMatch).toBe(true);
            expect(hashedPassword).not.toBe(testUser.password);
        });

        test('should create new user successfully', async () => {
            const hashedPassword = await bcrypt.hash(testUser.password, 10);

            const user = new User({
                email: testUser.email,
                password: hashedPassword,
                fullName: testUser.fullName,
                phone: testUser.phone,
                role: 'user',
                isEmailVerified: false,
                isActive: true
            });

            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.email).toBe(testUser.email);
            expect(savedUser.fullName).toBe(testUser.fullName);
            expect(savedUser.password).not.toBe(testUser.password);
            expect(savedUser.createdAt).toBeDefined();
        });

        test('should not allow duplicate email', async () => {
            const hashedPassword = await bcrypt.hash(testUser.password, 10);

            const duplicateUser = new User({
                email: testUser.email,
                password: hashedPassword,
                fullName: 'Duplicate User'
            });

            await expect(duplicateUser.save()).rejects.toThrow();
        });

        test('should require email field', async () => {
            const userWithoutEmail = new User({
                password: 'password123',
                fullName: 'No Email User'
            });

            await expect(userWithoutEmail.save()).rejects.toThrow();
        });

        test('should validate email format', async () => {
            const userWithInvalidEmail = new User({
                email: 'invalid-email',
                password: 'password123',
                fullName: 'Invalid Email User'
            });

            await expect(userWithInvalidEmail.save()).rejects.toThrow();
        });
    });

    describe('User Login & JWT', () => {
        test('should generate valid JWT token', () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const secret = process.env.JWT_SECRET || 'test-secret';

            const token = jwt.sign(
                { userId, email: testUser.email },
                secret,
                { expiresIn: '24h' }
            );

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');

            // Verify token
            const decoded = jwt.verify(token, secret);
            expect(decoded.userId).toBe(userId);
            expect(decoded.email).toBe(testUser.email);
        });

        test('should verify password correctly', async () => {
            const user = await User.findOne({ email: testUser.email });
            expect(user).toBeDefined();

            const isMatch = await bcrypt.compare(testUser.password, user.password);
            expect(isMatch).toBe(true);

            const isWrongPassword = await bcrypt.compare('wrongpassword', user.password);
            expect(isWrongPassword).toBe(false);
        });

        test('should reject expired JWT token', () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const secret = process.env.JWT_SECRET || 'test-secret';

            const token = jwt.sign(
                { userId, email: testUser.email },
                secret,
                { expiresIn: '0s' } // Expires immediately
            );

            // Wait a bit to ensure expiration
            setTimeout(() => {
                expect(() => jwt.verify(token, secret)).toThrow();
            }, 100);
        });

        test('should reject invalid JWT secret', () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const secret = 'correct-secret';
            const wrongSecret = 'wrong-secret';

            const token = jwt.sign({ userId }, secret, { expiresIn: '1h' });

            expect(() => jwt.verify(token, wrongSecret)).toThrow();
        });
    });

    describe('User Roles & Permissions', () => {
        test('should default to user role', async () => {
            const user = await User.findOne({ email: testUser.email });
            expect(user.role).toBe('user');
        });

        test('should allow setting doctor role', async () => {
            const doctor = new User({
                email: 'doctor@example.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Dr. Test',
                role: 'doctor'
            });

            const savedDoctor = await doctor.save();
            expect(savedDoctor.role).toBe('doctor');

            await User.deleteOne({ _id: savedDoctor._id });
        });

        test('should allow setting admin role', async () => {
            const admin = new User({
                email: 'admin@example.com',
                password: await bcrypt.hash('password123', 10),
                fullName: 'Admin Test',
                role: 'admin'
            });

            const savedAdmin = await admin.save();
            expect(savedAdmin.role).toBe('admin');

            await User.deleteOne({ _id: savedAdmin._id });
        });
    });

    describe('User Profile Management', () => {
        test('should update user profile', async () => {
            const user = await User.findOne({ email: testUser.email });

            user.phone = '+9876543210';
            user.dateOfBirth = new Date('1990-01-01');
            user.gender = 'male';

            const updatedUser = await user.save();

            expect(updatedUser.phone).toBe('+9876543210');
            expect(updatedUser.dateOfBirth).toBeDefined();
            expect(updatedUser.gender).toBe('male');
        });

        test('should update medical information', async () => {
            const user = await User.findOne({ email: testUser.email });

            user.medicalInfo = {
                height: 180,
                weight: 75,
                bloodType: 'O+',
                conditions: ['Asthma'],
                medications: ['Albuterol'],
                allergies: ['Peanuts']
            };

            const updatedUser = await user.save();

            expect(updatedUser.medicalInfo.height).toBe(180);
            expect(updatedUser.medicalInfo.conditions).toContain('Asthma');
        });
    });
});
