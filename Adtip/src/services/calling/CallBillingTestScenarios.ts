/**
 * Call Billing Test Scenarios
 * 
 * This file contains example scenarios to test the billing functionality
 */

// Test Scenario 1: Premium user with ₹20 balance starting a video call
// Expected: Video call rate for premium user is ₹7/min
// Max duration: 20 / 7 = 2.85 minutes = 2 minutes 51 seconds = 171 seconds
// Warnings should appear at: 171, 120, 60, 30, 10 seconds remaining

// Test Scenario 2: Non-premium user with ₹15 balance starting a voice call  
// Expected: Voice call rate for non-premium user is ₹7/min
// Max duration: 15 / 7 = 2.14 minutes = 2 minutes 8 seconds = 128 seconds
// Warnings should appear at: 120, 60, 30, 10 seconds remaining

// Test Scenario 3: Premium user with ₹5 balance starting a video call
// Expected: Video call rate for premium user is ₹7/min
// Max duration: 5 / 7 = 0.71 minutes = 42 seconds
// Warnings should appear at: 30, 10 seconds remaining

// Test Scenario 4: User with ₹2 balance starting any call
// Expected: Should be blocked at TipCallScreen level (minimum ₹1 required)
// But if somehow started, would allow very short calls

// Test Scenario 5: User with exactly ₹7 balance starting voice call (non-premium)
// Expected: Exactly 1 minute of call time
// Max duration: 7 / 7 = 1 minute = 60 seconds
// Warnings should appear at: 60, 30, 10 seconds remaining

// Test Scenario 6: Rich user with ₹1000 balance
// Expected: Long call duration, warnings only at standard thresholds
// For video non-premium: 1000 / 14 = 71.4 minutes = 4284 seconds
// Warnings should appear at: 300, 120, 60, 30, 10 seconds remaining

export const BILLING_TEST_SCENARIOS = {
  PREMIUM_VIDEO_20: {
    balance: 20,
    isPremium: true,
    callType: 'video' as const,
    expectedMaxSeconds: 171,
    expectedRate: 7,
    expectedWarnings: [120, 60, 30, 10]
  },
  REGULAR_VOICE_15: {
    balance: 15,
    isPremium: false,
    callType: 'voice' as const,
    expectedMaxSeconds: 128,
    expectedRate: 7,
    expectedWarnings: [120, 60, 30, 10]
  },
  PREMIUM_VIDEO_5: {
    balance: 5,
    isPremium: true,
    callType: 'video' as const,
    expectedMaxSeconds: 42,
    expectedRate: 7,
    expectedWarnings: [30, 10]
  },
  EXACT_BALANCE: {
    balance: 7,
    isPremium: false,
    callType: 'voice' as const,
    expectedMaxSeconds: 60,
    expectedRate: 7,
    expectedWarnings: [60, 30, 10]
  },
  RICH_USER: {
    balance: 1000,
    isPremium: false,
    callType: 'video' as const,
    expectedMaxSeconds: 4285, // 71.4 minutes
    expectedRate: 14,
    expectedWarnings: [300, 120, 60, 30, 10]
  }
};

// Usage in testing:
// const scenario = BILLING_TEST_SCENARIOS.PREMIUM_VIDEO_20;
// const billingInfo = await CallBillingService.getInstance().calculateCallBilling(
//   'testUser',
//   scenario.callType,
//   scenario.balance,
//   scenario.isPremium
// );
// console.log('Expected:', scenario.expectedMaxSeconds, 'Actual:', billingInfo.maxDurationSeconds);
