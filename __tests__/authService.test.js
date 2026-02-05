/**
 * Unit Tests for Auth Service
 * Tests user registration, login, token generation
 */

import { jest } from '@jest/globals';
import * as authService from '../backend/services/authService.js';
import User from '../backend/models/User.js';
import bcrypt from 'bcryptjs';

// Mock User model
jest.mock('../backend/models/User.js');
jest.mock('../backend/utils/configValidator.js', () => ({
    getConfig: () => ({
        jwt: {
            secret: 'test-secret-key-for-testing-purposes-only',
            algorithm: 'HS256',
            expirationMinutes: 1440
        },
        security: {
            bcryptRounds: 10
        }
    })
}));

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should successfully register a new user', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                profile: { fullName: 'Test User' },
                createdAt: new Date()
            };

            User.findOneAndUpdate = jest.fn().mockResolvedValue(mockUser);

            const result = await authService.registerUser({
                email: 'test@example.com',
                password: 'SecurePass123!',
                fullName: 'Test User',
                age: 25,
                gender: 'male',
                phone: '+1234567890'
            });

            expect(result).toEqual({
                userId: 'user123',
                email: 'test@example.com',
                fullName: 'Test User'
            });
        });

        it('should throw error if email already exists', async () => {
            const existingUser = {
                _id: 'user123',
                email: 'test@example.com',
                createdAt: new Date(Date.now() - 5000) // Created 5 seconds ago
            };

            User.findOneAndUpdate = jest.fn().mockResolvedValue(existingUser);

            await expect(
                authService.registerUser({
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    fullName: 'Test User'
                })
            ).rejects.toThrow('EMAIL_EXISTS');
        });
    });

    describe('loginUser', () => {
        it('should successfully login with valid credentials', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: await bcrypt.hash('SecurePass123!', 10),
                profile: { fullName: 'Test User' },
                role: 'user',
                isVerified: true,
                status: 'active',
                lastLogin: new Date(),
                save: jest.fn()
            };

            mockUser.comparePassword = jest.fn().mockResolvedValue(true);
            User.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const result = await authService.loginUser({
                email: 'test@example.com',
                password: 'SecurePass123!'
            });

            expect(result.user.email).toBe('test@example.com');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });

        it('should throw INVALID_CREDENTIALS for wrong password', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                status: 'active'
            };

            User.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const bcryptCompare = jest.spyOn(bcrypt, 'compare');
            bcryptCompare.mockResolvedValue(false);

            await expect(
                authService.loginUser({
                    email: 'test@example.com',
                    password: 'WrongPassword'
                })
            ).rejects.toThrow('INVALID_CREDENTIALS');
        });

        it('should throw ACCOUNT_SUSPENDED for suspended account', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                status: 'suspended'
            };

            User.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            await expect(
                authService.loginUser({
                    email: 'test@example.com',
                    password: 'SecurePass123!'
                })
            ).rejects.toThrow('ACCOUNT_SUSPENDED');
        });
    });

    describe('generateAccessToken', () => {
        it('should generate valid JWT token', () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                role: 'user'
            };

            const token = authService.generateAccessToken(mockUser);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
        });
    });
});
