import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from './LogUtils';

/**
 * OfflineCallTestUtil - Comprehensive testing utility for offline call functionality
 * 
 * This utility helps test and verify that the offline call issue fix is working properly
 * by simulating various scenarios and providing diagnostic information.
 */

interface TestScenario {
  name: string;
  description: string;
  steps: string[];
}

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
  duration?: number;
  errors?: string[];
}

class OfflineCallTestUtil {
  private static instance: OfflineCallTestUtil;
  private results: TestResult[] = [];

  private constructor() {}

  public static getInstance(): OfflineCallTestUtil {
    if (!OfflineCallTestUtil.instance) {
      OfflineCallTestUtil.instance = new OfflineCallTestUtil();
    }
    return OfflineCallTestUtil.instance;
  }

  /**
   * Run comprehensive offline call tests
   */
  public async runAllTests(): Promise<TestResult[]> {
    Logger.info('[OfflineCallTest] 🧪 Starting comprehensive offline call functionality tests...');
    
    this.results = [];
    
    // Test scenarios
    const scenarios = [
      this.testCallStatePersistence,
      this.testCallStateRecovery,
      this.testExpiredCallHandling,
      this.testMissedCallStorage,
      this.testAppStateMonitoring,
      this.testServiceInitialization,
      this.testFCMBackgroundHandling,
      this.testVideoSDKRecovery
    ];

    // Run all tests
    for (const testFn of scenarios) {
      try {
        await testFn.call(this);
      } catch (error) {
        Logger.error('[OfflineCallTest] Test execution error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.results.push({
          scenario: 'Unknown',
          passed: false,
          details: `Test execution failed: ${errorMessage}`
        });
      }
    }

    // Generate summary
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    
    Logger.info('[OfflineCallTest] 📊 Test Summary:', {
      passed: passedTests,
      total: totalTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`
    });

    return this.results;
  }

  /**
   * Test call state persistence functionality
   */
  private async testCallStatePersistence(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'Call State Persistence';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing call state persistence...');

      // Import service
      const { default: CallStatePersistenceService } = await import('../services/calling/CallStatePersistenceService');
      const service = CallStatePersistenceService.getInstance();
      
      // Initialize service
      await service.initialize();

      // Test data
      const testCallData = {
        sessionId: `test-${Date.now()}`,
        callerName: 'Test Caller',
        callType: 'video' as const,
        meetingId: `test-meeting-${Date.now()}`,
        token: `test-token-${Date.now()}`,
        callerId: '123',
        receiverId: '456'
      };

      // Save call state
      const saveSuccess = await service.saveCallState(testCallData);
      if (!saveSuccess) {
        throw new Error('Failed to save call state');
      }

      // Retrieve call state
      const retrievedState = await service.getCallState();
      if (!retrievedState) {
        throw new Error('Failed to retrieve call state');
      }

      // Verify data integrity
      if (retrievedState.sessionId !== testCallData.sessionId ||
          retrievedState.callerName !== testCallData.callerName ||
          retrievedState.callType !== testCallData.callType) {
        throw new Error('Retrieved call state does not match saved data');
      }

      // Update call status
      const updateSuccess = await service.updateCallStatus('active');
      if (!updateSuccess) {
        throw new Error('Failed to update call status');
      }

      // Clean up
      await service.clearCallState();

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'Call state persistence working correctly',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ Call state persistence test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `Call state persistence failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ Call state persistence test failed:', error);
    }
  }

  /**
   * Test call state recovery functionality
   */
  private async testCallStateRecovery(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'Call State Recovery';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing call state recovery...');

      const { default: CallStatePersistenceService } = await import('../services/calling/CallStatePersistenceService');
      const service = CallStatePersistenceService.getInstance();
      
      await service.initialize();

      // Create a recent call state
      const recentCallData = {
        sessionId: `recovery-test-${Date.now()}`,
        callerName: 'Recovery Test Caller',
        callType: 'voice' as const,
        meetingId: `recovery-meeting-${Date.now()}`,
        token: `recovery-token-${Date.now()}`,
        timestamp: Date.now() - 30000, // 30 seconds ago
        expiresAt: Date.now() + 30000   // Expires in 30 seconds
      };

      await service.saveCallState(recentCallData);

      // Test recovery
      const recoveredCall = await service.checkForCallRecovery({
        maxCallAge: 60000, // 1 minute
        showMissedCallUI: false
      });

      if (!recoveredCall) {
        throw new Error('Failed to recover recent call');
      }

      if (recoveredCall.sessionId !== recentCallData.sessionId) {
        throw new Error('Recovered call data does not match');
      }

      // Clean up
      await service.clearCallState();

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'Call state recovery working correctly',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ Call state recovery test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `Call state recovery failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ Call state recovery test failed:', error);
    }
  }

  /**
   * Test expired call handling
   */
  private async testExpiredCallHandling(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'Expired Call Handling';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing expired call handling...');

      const { default: CallStatePersistenceService } = await import('../services/calling/CallStatePersistenceService');
      const service = CallStatePersistenceService.getInstance();
      
      await service.initialize();

      // Create an expired call state
      const expiredCallData = {
        sessionId: `expired-test-${Date.now()}`,
        callerName: 'Expired Test Caller',
        callType: 'video' as const,
        meetingId: `expired-meeting-${Date.now()}`,
        token: `expired-token-${Date.now()}`,
        timestamp: Date.now() - 120000, // 2 minutes ago
        expiresAt: Date.now() - 60000   // Expired 1 minute ago
      };

      await service.saveCallState(expiredCallData);

      // Test recovery - should return null for expired call
      const recoveredCall = await service.checkForCallRecovery({
        maxCallAge: 60000, // 1 minute
        showMissedCallUI: true
      });

      if (recoveredCall && recoveredCall.status !== 'missed') {
        throw new Error('Expired call should be marked as missed or return null');
      }

      // Check missed calls
      const missedCalls = await service.getMissedCalls();
      const foundMissedCall = missedCalls.find((call: any) => call.sessionId === expiredCallData.sessionId);
      
      if (!foundMissedCall) {
        throw new Error('Expired call should be moved to missed calls');
      }

      // Clean up
      await service.clearMissedCalls();

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'Expired call handling working correctly',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ Expired call handling test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `Expired call handling failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ Expired call handling test failed:', error);
    }
  }

  /**
   * Test missed call storage functionality
   */
  private async testMissedCallStorage(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'Missed Call Storage';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing missed call storage...');

      const { default: CallStatePersistenceService } = await import('../services/calling/CallStatePersistenceService');
      const service = CallStatePersistenceService.getInstance();
      
      await service.initialize();

      // Clear existing missed calls
      await service.clearMissedCalls();

      // Create and save multiple missed calls
      for (let i = 0; i < 3; i++) {
        const missedCallData = {
          sessionId: `missed-${i}-${Date.now()}`,
          callerName: `Missed Caller ${i}`,
          callType: i % 2 === 0 ? 'video' as const : 'voice' as const,
          meetingId: `missed-meeting-${i}-${Date.now()}`,
          token: `missed-token-${i}-${Date.now()}`,
          status: 'missed' as const
        };

        await service.saveCallState(missedCallData);
        
        // Force expiry and move to missed calls
        await service.updateCallStatus('missed');
        await service.checkForCallRecovery({ maxCallAge: 0 });
      }

      // Retrieve missed calls
      const missedCalls = await service.getMissedCalls();
      
      if (missedCalls.length !== 3) {
        throw new Error(`Expected 3 missed calls, found ${missedCalls.length}`);
      }

      // Verify all are marked as missed
      const allMissed = missedCalls.every((call: any) => call.status === 'missed');
      if (!allMissed) {
        throw new Error('Not all calls are marked as missed');
      }

      // Clean up
      await service.clearMissedCalls();

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'Missed call storage working correctly',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ Missed call storage test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `Missed call storage failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ Missed call storage test failed:', error);
    }
  }

  /**
   * Test app state monitoring
   */
  private async testAppStateMonitoring(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'App State Monitoring';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing app state monitoring...');

      const { default: CallStatePersistenceService } = await import('../services/calling/CallStatePersistenceService');
      const service = CallStatePersistenceService.getInstance();
      
      await service.initialize();

      // Get service status
      const status = service.getStatus();
      
      if (!status.initialized) {
        throw new Error('Service should be initialized');
      }

      if (!status.appStateMonitored) {
        throw new Error('App state monitoring should be active');
      }

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'App state monitoring is active and working',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ App state monitoring test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `App state monitoring failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ App state monitoring test failed:', error);
    }
  }

  /**
   * Test service initialization
   */
  private async testServiceInitialization(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'Service Initialization';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing service initialization...');

      // Test CallStatePersistenceService
      const { default: CallStatePersistenceService } = await import('../services/calling/CallStatePersistenceService');
      const persistenceService = CallStatePersistenceService.getInstance();
      await persistenceService.initialize();

      // Test VideoSDKService
      const { default: VideoSDKService } = await import('../services/videosdk/VideoSDKService');
      const videoSDKService = VideoSDKService.getInstance();
      await videoSDKService.initialize();

      // Test NotifeeCallHandler
      const { default: NotifeeCallHandler } = await import('../services/notification/NotifeeCallHandler');
      const notifeeHandler = NotifeeCallHandler.getInstance();
      await notifeeHandler.initialize();

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'All critical services initialized successfully',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ Service initialization test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `Service initialization failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ Service initialization test failed:', error);
    }
  }

  /**
   * Test FCM background handling simulation
   */
  private async testFCMBackgroundHandling(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'FCM Background Handling';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing FCM background handling simulation...');

      // Simulate FCM message structure
      const mockFCMMessage = {
        messageId: `test-fcm-${Date.now()}`,
        data: {
          info: JSON.stringify({
            type: 'CALL_INITIATED',
            sessionId: `test-session-${Date.now()}`,
            callerName: 'Test FCM Caller',
            callType: 'video',
            videoSDKInfo: {
              meetingId: `test-meeting-${Date.now()}`,
              token: `test-token-${Date.now()}`
            }
          })
        },
        notification: {
          title: 'Incoming Call',
          body: 'Test FCM Caller is calling...'
        }
      };

      // Test FCM message parsing
      const { FCMMessageRouter } = await import('../services/FCMMessageRouter');
      const router = FCMMessageRouter.getInstance();
      await router.initialize();

      // This would normally route the message, but we'll just verify the router is ready
      const routerStatus = router.getStatus();
      if (!routerStatus.initialized) {
        throw new Error('FCM Message Router should be initialized');
      }

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'FCM background handling infrastructure is ready',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ FCM background handling test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `FCM background handling failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ FCM background handling test failed:', error);
    }
  }

  /**
   * Test VideoSDK recovery functionality
   */
  private async testVideoSDKRecovery(): Promise<void> {
    const startTime = Date.now();
    const scenario = 'VideoSDK Recovery';
    
    try {
      Logger.info('[OfflineCallTest] 🧪 Testing VideoSDK recovery functionality...');

      const { default: VideoSDKService } = await import('../services/videosdk/VideoSDKService');
      const videoSDKService = VideoSDKService.getInstance();
      
      // Ensure VideoSDK is initialized
      await videoSDKService.initialize();

      // Test recovery data structure
      const recoveryData = {
        meetingId: `recovery-meeting-${Date.now()}`,
        token: `recovery-token-${Date.now()}`,
        participantName: 'Test Participant',
        micEnabled: true,
        webcamEnabled: true,
        mode: 'CONFERENCE'
      };

      // Verify VideoSDK service can accept recovery parameters
      // Note: We're not actually joining a meeting in tests, just verifying the interface
      const canJoin = typeof videoSDKService.joinMeeting === 'function';
      
      if (!canJoin) {
        throw new Error('VideoSDK service missing joinMeeting method for recovery');
      }

      const duration = Date.now() - startTime;
      this.results.push({
        scenario,
        passed: true,
        details: 'VideoSDK recovery interface is available',
        duration
      });

      Logger.info('[OfflineCallTest] ✅ VideoSDK recovery test passed');

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        scenario,
        passed: false,
        details: `VideoSDK recovery failed: ${errorMessage}`,
        duration,
        errors: [errorMessage]
      });

      Logger.error('[OfflineCallTest] ❌ VideoSDK recovery test failed:', error);
    }
  }

  /**
   * Generate test report
   */
  public generateReport(): string {
    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);
    
    let report = '\n';
    report += '=======================================\n';
    report += '   OFFLINE CALL FUNCTIONALITY TEST REPORT\n';
    report += '=======================================\n\n';
    
    report += `📊 SUMMARY:\n`;
    report += `   Total Tests: ${this.results.length}\n`;
    report += `   ✅ Passed: ${passedTests.length}\n`;
    report += `   ❌ Failed: ${failedTests.length}\n`;
    report += `   Success Rate: ${Math.round((passedTests.length / this.results.length) * 100)}%\n\n`;

    if (passedTests.length > 0) {
      report += '✅ PASSED TESTS:\n';
      passedTests.forEach(test => {
        report += `   • ${test.scenario}: ${test.details}`;
        if (test.duration) {
          report += ` (${test.duration}ms)`;
        }
        report += '\n';
      });
      report += '\n';
    }

    if (failedTests.length > 0) {
      report += '❌ FAILED TESTS:\n';
      failedTests.forEach(test => {
        report += `   • ${test.scenario}: ${test.details}`;
        if (test.duration) {
          report += ` (${test.duration}ms)`;
        }
        if (test.errors?.length) {
          report += `\n     Errors: ${test.errors.join(', ')}`;
        }
        report += '\n';
      });
      report += '\n';
    }

    report += '=======================================\n';

    return report;
  }

  /**
   * Clear test results
   */
  public clearResults(): void {
    this.results = [];
  }
}

export default OfflineCallTestUtil;
export type { TestResult, TestScenario };