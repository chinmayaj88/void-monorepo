// Test setup file
// Set NODE_ENV to test to disable rate limiting
process.env.NODE_ENV = 'test';

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';

// Set test database config
// For E2E tests, use the actual database (void_clouddrive) if test DB doesn't exist
// For unit/integration tests, use mocks so database is not needed
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
// Use actual database for E2E tests (they need real DB)
// Unit/integration tests use mocks, so they don't need DB
process.env.DB_NAME = process.env.DB_NAME || 'void_clouddrive';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Increase timeout for async tests
jest.setTimeout(10000);

