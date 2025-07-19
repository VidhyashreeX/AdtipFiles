module.exports = {
  // Test environment
  preset: 'react-native',
  testEnvironment: 'node',

  // Root directories
  roots: ['<rootDir>/testing', '<rootDir>/Adtip/src'],

  // Test file patterns
  testMatch: [
    '<rootDir>/testing/**/*.test.ts',
    '<rootDir>/testing/**/*.test.tsx',
    '<rootDir>/testing/**/*.spec.ts',
    '<rootDir>/testing/**/*.spec.tsx'
  ],

  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/Adtip/src/$1',
    '^@testing/(.*)$': '<rootDir>/testing/$1',
    
    // Mock React Native modules
    '^react-native$': 'react-native',
    '^@react-native-firebase/messaging$': '<rootDir>/testing/mocks/firebase-messaging.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/testing/mocks/async-storage.js',
    '^react-native-callkeep$': '<rootDir>/testing/mocks/react-native-callkeep.js',
    
    // Mock image assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/testing/mocks/fileMock.js'
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/testing/setup/jest.setup.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'Adtip/src/services/calling/**/*.{ts,tsx}',
    'Adtip/src/services/FCMMessageRouter.ts',
    'Adtip/src/services/chat/ChatFCMHandler.ts',
    'Adtip/src/services/notification/NotificationFCMHandler.ts',
    'Adtip/src/components/call/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/testing/**'
  ],

  coverageDirectory: '<rootDir>/testing/coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical files
    'Adtip/src/services/calling/CallFCMHandler.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'Adtip/src/services/calling/CallUICoordinator.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'Adtip/src/services/FCMMessageRouter.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Test projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/testing/unit/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/testing/integration/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/testing/performance/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 60000 // Longer timeout for performance tests
    }
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/testing/setup/globalSetup.js',
  globalTeardown: '<rootDir>/testing/setup/globalTeardown.js',

  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/testing/coverage/',
    '<rootDir>/testing/reports/'
  ],

  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/testing/reports',
        filename: 'jest-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'VideoSDK CallKeep Integration Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/testing/reports',
        outputName: 'junit.xml',
        suiteName: 'VideoSDK CallKeep Integration Tests'
      }
    ]
  ],

  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: true,

  // Snapshot configuration
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],

  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/Adtip/src',
    '<rootDir>/testing'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/Adtip/android/',
    '<rootDir>/Adtip/ios/'
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-firebase|react-native-callkeep)/)'
  ]
}
