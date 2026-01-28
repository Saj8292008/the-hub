/**
 * Test Setup and Configuration
 * Global setup for all tests using Mocha + Chai + Sinon
 */

require('dotenv').config({ path: '.env.test' });
const sinon = require('sinon');
const chai = require('chai');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Different port for testing

// Make chai globally available
global.expect = chai.expect;
global.sinon = sinon;

// Stub console methods to reduce noise during tests (keep error for debugging)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: originalConsole.error
};

// Export for use in tests
module.exports = {
  chai,
  sinon,
  expect: chai.expect
};
