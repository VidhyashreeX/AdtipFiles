module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/guest-mode/setup.js'],
  testMatch: ['<rootDir>/__tests__/guest-mode/**/*.test.{js,jsx,ts,tsx}'],
  collectCoverageFrom: [
    'src/contexts/AuthContext.tsx',
    'src/services/ApiService.ts',
    'src/components/modals/LoginPromptModal.tsx',
    'src/screens/auth/OnboardingScreen.tsx',
    'src/screens/home/HomeScreen.tsx',
    'src/screens/tiptube/TipTubeScreen.tsx',
    'src/screens/tipshorts/TipShortsEnhanced.tsx',
    'src/components/common/Header.tsx',
    'src/components/common/UltraFastLoader.tsx',
    'src/hooks/useQueries.ts',
    'src/hooks/useShortsQuery.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/guest-mode',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-safe-area-context|@react-navigation)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
