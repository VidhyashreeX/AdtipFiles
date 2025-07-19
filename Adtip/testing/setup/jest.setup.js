/**
 * Jest setup file for VideoSDK CallKeep integration tests
 */

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default)
  },
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn().mockResolvedValue(true),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 })
  },
  Alert: {
    alert: jest.fn()
  },
  PermissionsAndroid: {
    request: jest.fn().mockResolvedValue('granted'),
    check: jest.fn().mockResolvedValue('granted'),
    PERMISSIONS: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO'
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied'
    }
  }
}))

// Mock Firebase Messaging
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    hasPermission: jest.fn().mockResolvedValue(true),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn().mockResolvedValue(true),
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    setBackgroundMessageHandler: jest.fn()
  })),
  FirebaseMessagingTypes: {
    AuthorizationStatus: {
      AUTHORIZED: 1,
      DENIED: 0,
      NOT_DETERMINED: -1
    }
  }
}))

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined)
}))

// Mock CallKeep
jest.mock('react-native-callkeep', () => ({
  setup: jest.fn().mockResolvedValue(true),
  displayIncomingCall: jest.fn().mockResolvedValue(true),
  answerIncomingCall: jest.fn(),
  endCall: jest.fn(),
  endAllCalls: jest.fn(),
  rejectCall: jest.fn(),
  isCallActive: jest.fn().mockReturnValue(false),
  getCalls: jest.fn().mockResolvedValue([]),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  checkPhoneAccountPermission: jest.fn().mockResolvedValue(true),
  requestPhoneAccountPermission: jest.fn().mockResolvedValue(true),
  hasPhoneAccount: jest.fn().mockReturnValue(true),
  hasDefaultPhoneAccount: jest.fn().mockReturnValue(true),
  setMutedCall: jest.fn(),
  setOnHold: jest.fn(),
  updateDisplay: jest.fn()
}))

// Mock VideoSDK
jest.mock('@videosdk.live/react-native-sdk', () => ({
  MeetingProvider: ({ children }) => children,
  useMeeting: jest.fn(() => ({
    join: jest.fn(),
    leave: jest.fn(),
    end: jest.fn(),
    participants: new Map(),
    localParticipant: {
      id: 'local-participant',
      displayName: 'Local User'
    }
  })),
  useParticipant: jest.fn(() => ({
    displayName: 'Test Participant',
    isLocal: false
  })),
  Constants: {
    events: {
      meetingJoined: 'meeting-joined',
      meetingLeft: 'meeting-left',
      participantJoined: 'participant-joined',
      participantLeft: 'participant-left'
    }
  }
}))

// Mock Zustand store
jest.mock('../../Adtip/src/stores/callStoreSimplified', () => ({
  useCallStore: {
    getState: jest.fn(() => ({
      status: 'idle',
      session: null,
      actions: {
        setStatus: jest.fn(),
        setSession: jest.fn(),
        reset: jest.fn()
      }
    })),
    setState: jest.fn(),
    subscribe: jest.fn()
  }
}))

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn()
  })),
  useRoute: jest.fn(() => ({
    params: {}
  })),
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: jest.fn()
}))

// Mock Flipper
jest.mock('react-native-flipper', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

// Global test utilities
global.mockFetch = (response, options = {}) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    ...options
  })
}

global.mockAsyncStorage = (data = {}) => {
  const storage = { ...data }
  
  require('@react-native-async-storage/async-storage').getItem.mockImplementation(
    (key) => Promise.resolve(storage[key] || null)
  )
  
  require('@react-native-async-storage/async-storage').setItem.mockImplementation(
    (key, value) => {
      storage[key] = value
      return Promise.resolve()
    }
  )
  
  require('@react-native-async-storage/async-storage').removeItem.mockImplementation(
    (key) => {
      delete storage[key]
      return Promise.resolve()
    }
  )
  
  return storage
}

global.mockCallKeep = (config = {}) => {
  const callKeep = require('react-native-callkeep')
  
  Object.keys(config).forEach(method => {
    if (callKeep[method]) {
      callKeep[method].mockImplementation(config[method])
    }
  })
  
  return callKeep
}

global.mockConsole = () => {
  const originalConsole = { ...console }
  const logs = []
  
  console.log = jest.fn((...args) => {
    logs.push({ level: 'log', args })
  })
  
  console.warn = jest.fn((...args) => {
    logs.push({ level: 'warn', args })
  })
  
  console.error = jest.fn((...args) => {
    logs.push({ level: 'error', args })
  })
  
  return {
    logs,
    restore: () => {
      Object.assign(console, originalConsole)
    }
  }
}

// Performance monitoring for tests
global.performance = global.performance || {
  now: () => Date.now()
}

// Timeout helpers
global.waitFor = (condition, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      if (condition()) {
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`))
      } else {
        setTimeout(check, 10)
      }
    }
    
    check()
  })
}

global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Error boundary for tests
global.TestErrorBoundary = class extends Error {
  constructor(message, originalError) {
    super(message)
    this.name = 'TestErrorBoundary'
    this.originalError = originalError
  }
}

// Test data generators
global.generateTestData = {
  sessionId: () => `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  meetingId: () => `test-meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  token: () => `test-token-${Date.now()}-${Math.random().toString(36).substr(2, 20)}`,
  callerName: () => `Test Caller ${Math.floor(Math.random() * 1000)}`,
  callerId: () => `test-caller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  
  // Reset AsyncStorage mock
  const AsyncStorage = require('@react-native-async-storage/async-storage')
  AsyncStorage.getItem.mockResolvedValue(null)
  AsyncStorage.setItem.mockResolvedValue(undefined)
  AsyncStorage.removeItem.mockResolvedValue(undefined)
  
  // Reset CallKeep mock
  const CallKeep = require('react-native-callkeep')
  CallKeep.setup.mockResolvedValue(true)
  CallKeep.displayIncomingCall.mockResolvedValue(true)
  CallKeep.isCallActive.mockReturnValue(false)
  CallKeep.getCalls.mockResolvedValue([])
  
  // Reset store mock
  const { useCallStore } = require('../../Adtip/src/stores/callStoreSimplified')
  useCallStore.getState.mockReturnValue({
    status: 'idle',
    session: null,
    actions: {
      setStatus: jest.fn(),
      setSession: jest.fn(),
      reset: jest.fn()
    }
  })
})

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Increase timeout for async operations
jest.setTimeout(30000)
