module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        types: ['jest', 'node'],
      },
    }],
  },
  // Allow jest to transform react-native and expo packages (they ship as ESM)
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|expo-file-system|expo-constants|expo-haptics|expo-av|expo-linear-gradient|@expo|react-native-reanimated|react-native-safe-area-context|@react-native-async-storage)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // expo-file-system v2 ships a /legacy sub-path; map it to the same mock
    '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system-legacy.js',
    '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system-legacy.js',
    // Mock react-native itself (avoid ESM parse issues in node environment)
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/__mocks__/react-native.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};

