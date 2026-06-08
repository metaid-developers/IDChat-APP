module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|expo-modules-core|@expo(nent)?/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-navigation|@react-navigation/.*)/)',
  ],
};
