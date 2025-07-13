import { BackgroundCallTester } from '../services/calling/BackgroundCallTester'

/**
 * Utility function to test background call functionality
 * Call this from anywhere in the app to verify fixes are working
 */
export async function testBackgroundCalls(): Promise<void> {
  try {
    console.log('🧪 Starting background call tests...')
    
    const tester = BackgroundCallTester.getInstance()
    const results = await tester.testBackgroundCallFlow()
    
    // Generate and log report
    const report = tester.generateTestReport(results)
    console.log(report)
    
    // Also test race conditions
    console.log('🧪 Testing race condition prevention...')
    const raceResults = await tester.testRaceConditionPrevention()
    console.log(`Race Condition Test: ${raceResults.success ? '✅ PASS' : '❌ FAIL'}`)
    
    if (raceResults.errors.length > 0) {
      console.log('Race condition errors:', raceResults.errors)
    }
    
    // Overall status
    const overallSuccess = results.success && raceResults.success
    console.log(`\n🎯 OVERALL TEST STATUS: ${overallSuccess ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`)
    
    if (overallSuccess) {
      console.log('✅ Background call functionality is working correctly!')
    } else {
      console.log('❌ Background call functionality has issues that need to be addressed.')
    }
    
  } catch (error) {
    console.error('🚨 Test execution failed:', error)
  }
}

/**
 * Quick test for specific functionality
 */
export async function quickTestBackgroundCall(): Promise<boolean> {
  try {
    const tester = BackgroundCallTester.getInstance()
    const results = await tester.testBackgroundCallFlow()
    return results.success
  } catch (error) {
    console.error('Quick test failed:', error)
    return false
  }
}

export default testBackgroundCalls
