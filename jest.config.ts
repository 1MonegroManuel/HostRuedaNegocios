import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  testTimeout: 30000, // 30 seconds timeout for tests
  setupFilesAfterEnv: ['<rootDir>/src/tests/env.ts'],
  // Si usas paths/aliases en tsconfig, habilita esto:
  // moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};

export default config;
