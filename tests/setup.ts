import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.HOME = '/tmp/test-home';
process.env.USER = 'test-user';

// Global test utilities
global.testUtils = {
  createMockContext: () => ({
    command: '/sc:test',
    personas: [],
    timestamp: Date.now(),
    user: 'test-user',
    environment: 'test',
    targetFiles: [],
    flags: {}
  }),
  
  createMockPersona: (name: string) => ({
    name,
    priority: 5,
    active: true
  }),
  
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock logger for tests
jest.mock('../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Increase timeout for integration tests
jest.setTimeout(30000);