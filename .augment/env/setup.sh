#!/bin/bash

# React Native Development Environment Setup Script
set -e

echo "🚀 Setting up React Native development environment..."

# Update system packages
sudo apt-get update

# Install Node.js 18 (required by the project)
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install Java 17 (required for React Native Android builds)
echo "☕ Installing Java 17..."
sudo apt-get install -y openjdk-17-jdk

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> $HOME/.profile

# Install Android SDK tools (minimal setup for testing)
echo "🤖 Installing Android SDK tools..."
sudo apt-get install -y wget unzip

# Create Android SDK directory
mkdir -p $HOME/Android/Sdk
cd $HOME/Android/Sdk

# Download and install command line tools
wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip -q commandlinetools-linux-9477386_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
rm commandlinetools-linux-9477386_latest.zip

# Set Android environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> $HOME/.profile
echo 'export ANDROID_SDK_ROOT=$HOME/Android/Sdk' >> $HOME/.profile
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> $HOME/.profile

# Accept Android licenses
yes | sdkmanager --licenses >/dev/null 2>&1 || true

# Install essential Android SDK components
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" >/dev/null 2>&1 || true

# Navigate to project directory
cd /mnt/persist/workspace/Adtip

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Install testing dependencies locally (not globally to avoid permission issues)
echo "🧪 Installing testing dependencies..."
npm install --save-dev @testing-library/react-native react-test-renderer

# Setup Jest environment
echo "🧪 Setting up Jest testing environment..."

# Update main jest config to work better with React Native
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-safe-area-context|@react-navigation|@react-native-firebase|@react-native-async-storage|react-native-gesture-handler)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  testPathIgnorePatterns: [
    '__tests__/guest-mode/jest.config.js',
    '__tests__/guest-mode/setup.js',
    '__tests__/guest-mode/run-tests.js'
  ],
};
EOF

# Create main jest setup file with comprehensive mocks
cat > jest.setup.js << 'EOF'
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Firebase App
jest.mock('@react-native-firebase/app', () => ({
  default: () => ({
    apps: [],
    app: () => ({
      delete: jest.fn(() => Promise.resolve()),
    }),
  }),
}));

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => ({
  default: () => ({
    currentUser: null,
    signInAnonymously: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
  }),
}));

// Mock Firebase Messaging
jest.mock('@react-native-firebase/messaging', () => ({
  default: () => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('fake-token')),
  }),
}));

// Mock Firebase Firestore
jest.mock('@react-native-firebase/firestore', () => ({
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(() => Promise.resolve({ data: () => ({}) })),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
    })),
  }),
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    TouchableOpacity: View,
    TouchableHighlight: View,
    TouchableNativeFeedback: View,
    TouchableWithoutFeedback: View,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {},
  };
});

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
EOF

# Create a simple test to verify setup
cat > __tests__/setup.test.js << 'EOF'
describe('Jest Setup', () => {
  test('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  test('should have basic functionality', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

echo "✅ React Native development environment setup complete!"
echo "📍 Project location: /mnt/persist/workspace/Adtip"
echo "🧪 Ready to run tests!"