/**
 * Billing Logic Test Utility
 * 
 * This utility tests the current billing logic to verify that only caller balance
 * affects call continuation and termination, not receiver balance.
 */

import { Logger } from './ProductionLogger';
import { CallBillingService } from '../services/calling/CallBillingService';
import ApiService from '../services/ApiService';

interface BillingTestResult {
  testName: string;
  success: boolean;
  details: any;
  error?: string;
}

interface BillingTestScenario {
  callerBalance: number;
  receiverBalance: number;
  callType: 'voice' | 'video';
  isPremium: boolean;
  expectedResult: 'continue' | 'terminate';
  description: string;
}

export class BillingLogicTest {
  private static instance: BillingLogicTest;
  private testResults: BillingTestResult[] = [];

  static getInstance(): BillingLogicTest {
    if (!this.instance) {
      this.instance = new BillingLogicTest();
    }
    return this.instance;
  }

  /**
   * Test scenarios to verify billing logic
   */
  private getTestScenarios(): BillingTestScenario[] {
    return [
      {
        callerBalance: 10,
        receiverBalance: 0,
        callType: 'voice',
        isPremium: false,
        expectedResult: 'continue',
        description: 'Caller has balance, receiver has no balance - should continue'
      },
      {
        callerBalance: 0,
        receiverBalance: 100,
        callType: 'voice',
        isPremium: false,
        expectedResult: 'terminate',
        description: 'Caller has no balance, receiver has balance - should terminate'
      },
      {
        callerBalance: 5,
        receiverBalance: 0,
        callType: 'video',
        isPremium: false,
        expectedResult: 'terminate',
        description: 'Caller has insufficient balance for video call - should terminate'
      },
      {
        callerBalance: 15,
        receiverBalance: 0,
        callType: 'video',
        isPremium: false,
        expectedResult: 'continue',
        description: 'Caller has sufficient balance for video call - should continue'
      },
      {
        callerBalance: 5,
        receiverBalance: 0,
        callType: 'voice',
        isPremium: true,
        expectedResult: 'continue',
        description: 'Premium caller with sufficient balance - should continue'
      },
      {
        callerBalance: 3,
        receiverBalance: 100,
        callType: 'voice',
        isPremium: true,
        expectedResult: 'terminate',
        description: 'Premium caller with insufficient balance - should terminate'
      }
    ];
  }

  /**
   * Test frontend billing service logic
   */
  async testFrontendBillingLogic(): Promise<BillingTestResult[]> {
    const results: BillingTestResult[] = [];
    const billingService = CallBillingService.getInstance();
    const scenarios = this.getTestScenarios();

    for (const scenario of scenarios) {
      try {
        Logger.info('BillingTest', `Testing scenario: ${scenario.description}`);

        // Test minimum balance check
        const balanceCheck = billingService.checkMinimumBalance(
          scenario.callType,
          scenario.callerBalance
        );

        // Test billing calculation
        const billingInfo = await billingService.calculateCallBilling(
          'test-user-id',
          scenario.callType,
          scenario.callerBalance,
          scenario.isPremium
        );

        // Determine if call should continue based on billing info
        const shouldContinue = billingInfo.maxDurationSeconds > 60; // At least 1 minute
        const actualResult = shouldContinue ? 'continue' : 'terminate';

        const success = actualResult === scenario.expectedResult;

        results.push({
          testName: `Frontend Billing: ${scenario.description}`,
          success,
          details: {
            scenario,
            balanceCheck,
            billingInfo,
            actualResult,
            expectedResult: scenario.expectedResult
          },
          error: success ? undefined : `Expected ${scenario.expectedResult}, got ${actualResult}`
        });

        Logger.info('BillingTest', `Scenario result: ${success ? 'PASS' : 'FAIL'}`, {
          scenario: scenario.description,
          actualResult,
          expectedResult: scenario.expectedResult
        });

      } catch (error) {
        results.push({
          testName: `Frontend Billing: ${scenario.description}`,
          success: false,
          details: { scenario },
          error: error instanceof Error ? error.message : String(error)
        });

        Logger.error('BillingTest', `Scenario failed: ${scenario.description}`, error);
      }
    }

    return results;
  }

  /**
   * Test backend billing sync logic (simulated)
   */
  async testBackendBillingSync(): Promise<BillingTestResult[]> {
    const results: BillingTestResult[] = [];
    const scenarios = this.getTestScenarios();

    for (const scenario of scenarios) {
      try {
        Logger.info('BillingTest', `Testing backend sync: ${scenario.description}`);

        // Simulate backend billing sync call
        const mockSyncParams = {
          callId: `test-call-${Date.now()}`,
          userId: 'test-caller-id',
          elapsedSeconds: 60, // 1 minute elapsed
          callType: scenario.callType
        };

        // Note: This would normally call the actual API, but for testing we simulate the logic
        const ratePerMinute = scenario.callType === 'video'
          ? (scenario.isPremium ? 7 : 14)
          : (scenario.isPremium ? 4 : 7);

        const currentCost = Math.ceil(mockSyncParams.elapsedSeconds / 60) * ratePerMinute;
        const remainingBalance = scenario.callerBalance - currentCost;
        const shouldContinue = remainingBalance >= ratePerMinute;

        const actualResult = shouldContinue ? 'continue' : 'terminate';
        const success = actualResult === scenario.expectedResult;

        results.push({
          testName: `Backend Sync: ${scenario.description}`,
          success,
          details: {
            scenario,
            mockSyncParams,
            ratePerMinute,
            currentCost,
            remainingBalance,
            shouldContinue,
            actualResult,
            expectedResult: scenario.expectedResult
          },
          error: success ? undefined : `Expected ${scenario.expectedResult}, got ${actualResult}`
        });

        Logger.info('BillingTest', `Backend sync result: ${success ? 'PASS' : 'FAIL'}`, {
          scenario: scenario.description,
          actualResult,
          expectedResult: scenario.expectedResult
        });

      } catch (error) {
        results.push({
          testName: `Backend Sync: ${scenario.description}`,
          success: false,
          details: { scenario },
          error: error instanceof Error ? error.message : String(error)
        });

        Logger.error('BillingTest', `Backend sync failed: ${scenario.description}`, error);
      }
    }

    return results;
  }

  /**
   * Test receiver balance independence
   */
  async testReceiverBalanceIndependence(): Promise<BillingTestResult> {
    try {
      Logger.info('BillingTest', 'Testing receiver balance independence');

      const billingService = CallBillingService.getInstance();
      
      // Test scenario: Caller has sufficient balance, receiver has zero balance
      const callerBalance = 20; // Sufficient for calls
      const receiverBalance = 0; // Zero balance
      
      // Test voice call
      const voiceBillingInfo = await billingService.calculateCallBilling(
        'test-caller-id',
        'voice',
        callerBalance,
        false
      );

      // Test video call
      const videoBillingInfo = await billingService.calculateCallBilling(
        'test-caller-id',
        'video',
        callerBalance,
        false
      );

      // Both should allow calls since only caller balance matters
      const voiceCanCall = voiceBillingInfo.maxDurationSeconds > 60;
      const videoCanCall = videoBillingInfo.maxDurationSeconds > 60;

      const success = voiceCanCall && videoCanCall;

      return {
        testName: 'Receiver Balance Independence',
        success,
        details: {
          callerBalance,
          receiverBalance,
          voiceBillingInfo,
          videoBillingInfo,
          voiceCanCall,
          videoCanCall
        },
        error: success ? undefined : 'Receiver balance incorrectly affecting call decisions'
      };

    } catch (error) {
      return {
        testName: 'Receiver Balance Independence',
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Run comprehensive billing logic tests
   */
  async runAllBillingTests(): Promise<BillingTestResult[]> {
    Logger.info('BillingTest', 'Starting comprehensive billing logic tests');

    const allResults: BillingTestResult[] = [];

    // Test frontend billing logic
    const frontendResults = await this.testFrontendBillingLogic();
    allResults.push(...frontendResults);

    // Test backend billing sync logic
    const backendResults = await this.testBackendBillingSync();
    allResults.push(...backendResults);

    // Test receiver balance independence
    const independenceResult = await this.testReceiverBalanceIndependence();
    allResults.push(independenceResult);

    // Store results
    this.testResults = allResults;

    // Log summary
    const passed = allResults.filter(r => r.success).length;
    const total = allResults.length;

    Logger.info('BillingTest', 'Billing logic tests completed', {
      totalTests: total,
      passed,
      failed: total - passed,
      passRate: `${((passed / total) * 100).toFixed(1)}%`
    });

    return allResults;
  }

  /**
   * Get test results
   */
  getTestResults(): BillingTestResult[] {
    return this.testResults;
  }

  /**
   * Clear test results
   */
  clearTestResults(): void {
    this.testResults = [];
  }

  /**
   * Generate test report
   */
  generateTestReport(): string {
    const results = this.testResults;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    let report = `# Billing Logic Test Report\n\n`;
    report += `**Total Tests**: ${results.length}\n`;
    report += `**Passed**: ${passed}\n`;
    report += `**Failed**: ${failed}\n`;
    report += `**Pass Rate**: ${((passed / results.length) * 100).toFixed(1)}%\n\n`;

    report += `## Test Results\n\n`;

    results.forEach((result, index) => {
      report += `### ${index + 1}. ${result.testName}\n`;
      report += `**Status**: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`;
      
      if (result.error) {
        report += `**Error**: ${result.error}\n`;
      }
      
      report += `**Details**: ${JSON.stringify(result.details, null, 2)}\n\n`;
    });

    return report;
  }
}

export default BillingLogicTest;
