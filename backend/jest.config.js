export default {
  // Use node test environment
  testEnvironment: 'node',
  
  // Support ES modules
  transform: {},
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage disabled for simplicity
  collectCoverage: false,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Verbose output
  verbose: true,
  
  // Timeout
  testTimeout: 10000
};

