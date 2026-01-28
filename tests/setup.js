/**
 * Test Setup and Configuration
 * Global setup for all tests
 */

require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Different port for testing

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error
};

// Global test timeout
jest.setTimeout(10000);

// Mock external services for unit tests
jest.mock('../src/services/openai/client', () => ({
  isAvailable: jest.fn(() => true),
  chat: jest.fn(),
  chatStream: jest.fn()
}));

jest.mock('../src/db/supabase', () => ({
  isAvailable: jest.fn(() => true),
  from: jest.fn(),
  storage: jest.fn(),
  auth: jest.fn()
}));

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections
  if (global.server) {
    await new Promise(resolve => global.server.close(resolve));
  }

  // Clear all mocks
  jest.clearAllMocks();
});
