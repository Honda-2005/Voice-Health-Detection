// Test setup file
// Runs before each test suite

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URL = 'mongodb://localhost:27017/voice_health_test';
process.env.SKIP_EMAIL_VERIFICATION = 'true';

// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);
