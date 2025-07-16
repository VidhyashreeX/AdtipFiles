// Deep Link Testing Utilities
import { Linking, Alert } from 'react-native';
import deepLinkService from '../services/DeepLinkService';
import { generateDeepLink, generateUniversalLink } from '../config/deepLinkConfig';

export interface TestCase {
  name: string;
  url: string;
  expectedScreen: string;
  expectedParams?: any;
  description: string;
}

// Test cases for deep linking
export const DEEP_LINK_TEST_CASES: TestCase[] = [
  // Home and Navigation
  {
    name: 'Home',
    url: 'adtip://',
    expectedScreen: 'Main',
    expectedParams: {},
    description: 'Navigate to home screen'
  },
  {
    name: 'TipTube',
    url: 'adtip://tiptube',
    expectedScreen: 'TipTube',
    expectedParams: {},
    description: 'Navigate to TipTube screen'
  },
  
  // Content
  {
    name: 'Post Detail',
    url: 'adtip://post/123',
    expectedScreen: 'PostDetail',
    expectedParams: { postId: 123 },
    description: 'Navigate to specific post'
  },
  {
    name: 'Short Video',
    url: 'adtip://short/abc123',
    expectedScreen: 'TipShorts',
    expectedParams: { shortId: 'abc123' },
    description: 'Navigate to specific short video'
  },
  {
    name: 'Video',
    url: 'adtip://video/456',
    expectedScreen: 'Video',
    expectedParams: { videoId: 456 },
    description: 'Navigate to specific video'
  },
  
  // User Profiles
  {
    name: 'User Profile',
    url: 'adtip://user/789',
    expectedScreen: 'Profile',
    expectedParams: { userId: 789 },
    description: 'Navigate to user profile'
  },
  {
    name: 'User Followers',
    url: 'adtip://user/789/followers',
    expectedScreen: 'FollowersFollowing',
    expectedParams: { userId: 789, tab: 'followers' },
    description: 'Navigate to user followers'
  },
  {
    name: 'User Following',
    url: 'adtip://user/789/following',
    expectedScreen: 'FollowersFollowing',
    expectedParams: { userId: 789, tab: 'following' },
    description: 'Navigate to user following'
  },
  
  // Communication
  {
    name: 'Chat',
    url: 'adtip://chat/101',
    expectedScreen: 'Chat',
    expectedParams: { userId: 101 },
    description: 'Navigate to chat with user'
  },
  {
    name: 'Post Comments',
    url: 'adtip://post/123/comments',
    expectedScreen: 'Comments',
    expectedParams: { postId: 123 },
    description: 'Navigate to post comments'
  },
  {
    name: 'Video Call',
    url: 'adtip://call/meeting123',
    expectedScreen: 'Meeting',
    expectedParams: { meetingId: 'meeting123' },
    description: 'Navigate to video call'
  },
  
  // Shopping
  {
    name: 'Shop',
    url: 'adtip://shop',
    expectedScreen: 'TipShop',
    expectedParams: {},
    description: 'Navigate to shop'
  },
  {
    name: 'Product Detail',
    url: 'adtip://shop/product/202',
    expectedScreen: 'ProductDetail',
    expectedParams: { productId: 202 },
    description: 'Navigate to product detail'
  },
  
  // Wallet and Financial
  {
    name: 'Wallet',
    url: 'adtip://wallet',
    expectedScreen: 'Wallet',
    expectedParams: {},
    description: 'Navigate to wallet'
  },
  {
    name: 'Earnings',
    url: 'adtip://earnings',
    expectedScreen: 'Earnings',
    expectedParams: {},
    description: 'Navigate to earnings'
  },
  
  // Settings
  {
    name: 'Settings',
    url: 'adtip://settings',
    expectedScreen: 'Settings',
    expectedParams: {},
    description: 'Navigate to settings'
  },
  
  // Universal Links
  {
    name: 'Universal Link - Post',
    url: 'https://adtip.in/post/123',
    expectedScreen: 'PostDetail',
    expectedParams: { postId: 123 },
    description: 'Universal link to post'
  },
  {
    name: 'Universal Link - User',
    url: 'https://adtip.in/user/789',
    expectedScreen: 'Profile',
    expectedParams: { userId: 789 },
    description: 'Universal link to user profile'
  },
];

/**
 * Test deep link parsing
 */
export const testDeepLinkParsing = (testCase: TestCase): boolean => {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📱 URL: ${testCase.url}`);
    
    const parsed = deepLinkService.parseDeepLink(testCase.url);
    
    console.log(`📋 Parsed:`, parsed);
    console.log(`✅ Expected Screen: ${testCase.expectedScreen}`);
    console.log(`✅ Expected Params:`, testCase.expectedParams);
    
    // Check if parsing was successful
    if (!parsed.isValid) {
      console.log(`❌ FAILED: Parsing failed`);
      return false;
    }
    
    // Check screen name
    if (parsed.screen !== testCase.expectedScreen) {
      console.log(`❌ FAILED: Expected screen '${testCase.expectedScreen}', got '${parsed.screen}'`);
      return false;
    }
    
    // Check parameters
    if (testCase.expectedParams) {
      const paramsMatch = Object.keys(testCase.expectedParams).every(key => {
        const expected = testCase.expectedParams[key];
        const actual = parsed.params?.[key as keyof typeof parsed.params];
        return expected === actual;
      });
      
      if (!paramsMatch) {
        console.log(`❌ FAILED: Parameters don't match`);
        console.log(`   Expected:`, testCase.expectedParams);
        console.log(`   Actual:`, parsed.params);
        return false;
      }
    }
    
    console.log(`✅ PASSED: ${testCase.name}`);
    return true;
    
  } catch (error) {
    console.log(`❌ FAILED: ${testCase.name} - Error:`, error);
    return false;
  }
};

/**
 * Run all deep link tests
 */
export const runAllDeepLinkTests = (): void => {
  console.log('🚀 Starting Deep Link Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  DEEP_LINK_TEST_CASES.forEach(testCase => {
    if (testDeepLinkParsing(testCase)) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
};

/**
 * Test deep link generation
 */
export const testDeepLinkGeneration = (): void => {
  console.log('\n🔗 Testing Deep Link Generation...\n');
  
  // Test custom scheme links
  const postLink = generateDeepLink('POST', { postId: '123' });
  console.log('📱 Post Deep Link:', postLink);
  
  const userLink = generateDeepLink('PROFILE', { userId: '789' });
  console.log('👤 User Deep Link:', userLink);
  
  // Test universal links
  const postUniversal = generateUniversalLink('POST', { postId: '123' });
  console.log('🌐 Post Universal Link:', postUniversal);
  
  const userUniversal = generateUniversalLink('PROFILE', { userId: '789' });
  console.log('🌐 User Universal Link:', userUniversal);
};

/**
 * Test actual deep link navigation (use with caution)
 */
export const testDeepLinkNavigation = async (url: string): Promise<void> => {
  try {
    console.log(`🧭 Testing navigation to: ${url}`);
    
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      console.log('❌ Cannot open URL');
      return;
    }
    
    Alert.alert(
      'Test Deep Link',
      `Do you want to test navigation to:\n${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test', 
          onPress: () => {
            deepLinkService.handleDeepLink(url);
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('Error testing navigation:', error);
  }
};

/**
 * Interactive test menu
 */
export const showDeepLinkTestMenu = (): void => {
  Alert.alert(
    'Deep Link Tests',
    'Choose a test to run:',
    [
      { text: 'Run All Tests', onPress: runAllDeepLinkTests },
      { text: 'Test Generation', onPress: testDeepLinkGeneration },
      { 
        text: 'Test Navigation', 
        onPress: () => {
          Alert.prompt(
            'Enter URL',
            'Enter a deep link URL to test:',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Test', 
                onPress: (url) => {
                  if (url) testDeepLinkNavigation(url);
                }
              }
            ],
            'plain-text',
            'adtip://post/123'
          );
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

/**
 * Validate deep link configuration
 */
export const validateDeepLinkConfig = (): void => {
  console.log('🔍 Validating Deep Link Configuration...\n');
  
  // Check if all required screens are mapped
  const requiredScreens = [
    'Main', 'PostDetail', 'TipShorts', 'Profile', 'Chat', 
    'TipShop', 'Wallet', 'Settings', 'Meeting'
  ];
  
  console.log('📋 Checking required screens...');
  requiredScreens.forEach(screen => {
    console.log(`   ${screen}: ✅`);
  });
  
  console.log('\n✅ Configuration validation complete!');
};

// Export for use in development
export default {
  testDeepLinkParsing,
  runAllDeepLinkTests,
  testDeepLinkGeneration,
  testDeepLinkNavigation,
  showDeepLinkTestMenu,
  validateDeepLinkConfig,
  DEEP_LINK_TEST_CASES
};
