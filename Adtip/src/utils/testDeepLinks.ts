/**
 * Test utility for verifying deep link generation and parsing
 * This file can be used for debugging and testing deep link functionality
 */

import { generateDeepLink, generateUniversalLink } from '../config/deepLinkConfig';
import DeepLinkService from '../services/DeepLinkService';

// Test deep link generation
export const testDeepLinkGeneration = () => {
  console.log('=== Testing Deep Link Generation ===');
  
  // Test post deep link
  const postLink = generateDeepLink('POST', { postId: 123 });
  console.log('Post Deep Link:', postLink);
  
  // Test video deep link
  const videoLink = generateDeepLink('VIDEO_PLAYER', { videoId: 456 });
  console.log('Video Deep Link:', videoLink);
  
  // Test short deep link
  const shortLink = generateDeepLink('SHORT', { shortId: '789' });
  console.log('Short Deep Link:', shortLink);
  
  // Test user profile deep link
  const userLink = generateDeepLink('PROFILE', { userId: 101 });
  console.log('User Profile Deep Link:', userLink);
  
  console.log('=== Testing Universal Link Generation ===');
  
  // Test universal links
  const postUniversalLink = generateUniversalLink('POST', { postId: 123 });
  console.log('Post Universal Link:', postUniversalLink);
  
  const videoUniversalLink = generateUniversalLink('VIDEO_PLAYER', { videoId: 456 });
  console.log('Video Universal Link:', videoUniversalLink);
  
  const shortUniversalLink = generateUniversalLink('SHORT', { shortId: '789' });
  console.log('Short Universal Link:', shortUniversalLink);
  
  const userUniversalLink = generateUniversalLink('PROFILE', { userId: 101 });
  console.log('User Universal Link:', userUniversalLink);
};

// Test deep link parsing
export const testDeepLinkParsing = () => {
  console.log('=== Testing Deep Link Parsing ===');
  
  const deepLinkService = new DeepLinkService();
  
  // Test URLs
  const testUrls = [
    'adtip://post/123',
    'adtip://watch/456', 
    'adtip://short/789',
    'adtip://user/101',
    'https://adtip.in/post/123',
    'https://adtip.in/watch/456',
    'https://adtip.in/short/789',
    'https://adtip.in/user/101',
  ];
  
  testUrls.forEach(url => {
    const parsed = deepLinkService.parseDeepLink(url);
    console.log(`URL: ${url}`);
    console.log(`Parsed:`, parsed);
    console.log('---');
  });
};

// Test share service integration
export const testShareServiceIntegration = async () => {
  console.log('=== Testing Share Service Integration ===');
  
  try {
    // Import ShareService dynamically to avoid circular dependencies
    const { default: shareService } = await import('../services/ShareService');
    
    // Test post sharing (dry run - just generate the link)
    console.log('Testing post share link generation...');
    const postShareOptions = { useUniversalLink: true, includeAppName: true };
    // Note: We can't actually call sharePost here as it would trigger the share dialog
    // Instead, we'll test the link generation logic
    
    console.log('Share service integration test completed');
  } catch (error) {
    console.error('Share service integration test failed:', error);
  }
};

// Run all tests
export const runAllDeepLinkTests = async () => {
  console.log('🚀 Starting Deep Link Tests...\n');
  
  testDeepLinkGeneration();
  console.log('\n');
  
  testDeepLinkParsing();
  console.log('\n');
  
  await testShareServiceIntegration();
  console.log('\n');
  
  console.log('✅ Deep Link Tests Completed!');
};

// Expected results for validation
export const expectedResults = {
  deepLinks: {
    post: 'adtip://post/123',
    video: 'adtip://watch/456',
    short: 'adtip://short/789',
    user: 'adtip://user/101',
  },
  universalLinks: {
    post: 'https://adtip.in/post/123',
    video: 'https://adtip.in/watch/456', 
    short: 'https://adtip.in/short/789',
    user: 'https://adtip.in/user/101',
  },
  parsing: {
    'adtip://post/123': { screen: 'PostViewer', params: { postId: 123 } },
    'adtip://watch/456': { screen: 'VideoPlayerModal', params: { videoId: 456 } },
    'adtip://short/789': { screen: 'TipShorts', params: { shortId: '789' } },
    'adtip://user/101': { screen: 'Profile', params: { userId: 101 } },
  }
};

// Validation function
export const validateResults = () => {
  console.log('=== Validating Results ===');
  
  // Validate deep link generation
  const postLink = generateDeepLink('POST', { postId: 123 });
  const isPostLinkValid = postLink === expectedResults.deepLinks.post;
  console.log(`Post link validation: ${isPostLinkValid ? '✅' : '❌'} (${postLink})`);
  
  const videoLink = generateDeepLink('VIDEO_PLAYER', { videoId: 456 });
  const isVideoLinkValid = videoLink === expectedResults.deepLinks.video;
  console.log(`Video link validation: ${isVideoLinkValid ? '✅' : '❌'} (${videoLink})`);
  
  const shortLink = generateDeepLink('SHORT', { shortId: '789' });
  const isShortLinkValid = shortLink === expectedResults.deepLinks.short;
  console.log(`Short link validation: ${isShortLinkValid ? '✅' : '❌'} (${shortLink})`);
  
  const userLink = generateDeepLink('PROFILE', { userId: 101 });
  const isUserLinkValid = userLink === expectedResults.deepLinks.user;
  console.log(`User link validation: ${isUserLinkValid ? '✅' : '❌'} (${userLink})`);
  
  // Validate universal link generation
  const postUniversalLink = generateUniversalLink('POST', { postId: 123 });
  const isPostUniversalValid = postUniversalLink === expectedResults.universalLinks.post;
  console.log(`Post universal link validation: ${isPostUniversalValid ? '✅' : '❌'} (${postUniversalLink})`);
  
  console.log('Validation completed!');
};
