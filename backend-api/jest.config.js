/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // globalSetup: '<rootDir>/tests/globalSetup.ts', // We can use scripts for this to keep it simple
  modulePathIgnorePatterns: ['<rootDir>/dist/']
};
