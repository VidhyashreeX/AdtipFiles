import { Platform } from 'react-native';
import { Logger } from './ProductionLogger';
import { KilledStateServiceOrchestrator } from '../services/KilledStateServiceOrchestrator';
import { KilledStatePerformanceMonitor } from '../services/KilledStatePerformanceMonitor';
import VideoSDKService from '../services/videosdk/VideoSDKService';
import FirebaseService from '../services/FirebaseService';

/**
 * Test scenario configuration
 */
export interface TestScenario {
  name: string;
  description: string;
  callType: 'voice' | 'video';
  networkCondition: 'good' | 'poor' | 'offline';
  deviceCondition: 'normal' | 'low_memory' | 'low_battery';
  expectedMaxTime: number; // Maximum acceptable time in milliseconds
}

/**
 * Test result for a single scenario
 */
export interface TestResult {
  scenario: TestScenario;
  success: boolean;
  actualTime: number;
  errors: string[];
  performanceGrade: 'excellent' | 'good' | 'poor';
  serviceMetrics: Record<string, number>;
}

/**
 * Comprehensive test suite for killed state functionality
 */
export class KilledStateTestingUtils {
  private static _instance: KilledStateTestingUtils;
  private testResults: TestResult[] = [];
  private isTestingMode = false;

  // Predefined test scenarios
  private readonly TEST_SCENARIOS: TestScenario[] = [
    {
      name: 'Optimal Conditions Voice Call',
      description: 'Voice call with good network and normal device conditions',
      callType: 'voice',
      networkCondition: 'good',
      deviceCondition: 'normal',
      expectedMaxTime: 3000,
    },
    {
      name: 'Optimal Conditions Video Call',
      description: 'Video call with good network and normal device conditions',
      callType: 'video',
      networkCondition: 'good',
      deviceCondition: 'normal',
      expectedMaxTime: 5000,
    },
    {
      name: 'Poor Network Voice Call',
      description: 'Voice call with poor network conditions',
      callType: 'voice',
      networkCondition: 'poor',
      deviceCondition: 'normal',
      expectedMaxTime: 8000,
    },
    {
      name: 'Low Memory Video Call',
      description: 'Video call with low memory conditions',
      callType: 'video',
      networkCondition: 'good',
      deviceCondition: 'low_memory',
      expectedMaxTime: 10000,
    },
    {
      name: 'Worst Case Scenario',
      description: 'Video call with poor network and low memory',
      callType: 'video',
      networkCondition: 'poor',
      deviceCondition: 'low_memory',
      expectedMaxTime: 15000,
    },
  ];

  private constructor() {
    Logger.info('KilledStateTestingUtils', 'Testing utilities initialized');
  }

  public static getInstance(): KilledStateTestingUtils {
    if (!KilledStateTestingUtils._instance) {
      KilledStateTestingUtils._instance = new KilledStateTestingUtils();
    }
    return KilledStateTestingUtils._instance;
  }

  /**
   * Run comprehensive test suite
   */
  public async runTestSuite(): Promise<TestResult[]> {
    Logger.info('KilledStateTestingUtils', '🧪 Starting comprehensive killed state test suite');
    
    this.isTestingMode = true;
    this.testResults = [];

    for (const scenario of this.TEST_SCENARIOS) {
      Logger.info('KilledStateTestingUtils', `🧪 Running test: ${scenario.name}`);
      
      try {
        const result = await this.runSingleTest(scenario);
        this.testResults.push(result);
        
        Logger.info('KilledStateTestingUtils', `✅ Test completed: ${scenario.name}`, {
          success: result.success,
          time: result.actualTime,
          grade: result.performanceGrade,
        });
        
        // Add delay between tests to avoid interference
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        Logger.error('KilledStateTestingUtils', `❌ Test failed: ${scenario.name}`, { error });
        
        this.testResults.push({
          scenario,
          success: false,
          actualTime: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          performanceGrade: 'poor',
          serviceMetrics: {},
        });
      }
    }

    this.isTestingMode = false;
    
    // Generate test report
    this.generateTestReport();
    
    return this.testResults;
  }

  /**
   * Run a single test scenario
   */
  private async runSingleTest(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    const sessionId = `test-${Date.now()}`;
    const errors: string[] = [];
    let serviceMetrics: Record<string, number> = {};

    try {
      // Simulate test conditions
      await this.simulateTestConditions(scenario);

      // Get orchestrator and performance monitor
      const orchestrator = KilledStateServiceOrchestrator.getInstance();
      const performanceMonitor = KilledStatePerformanceMonitor.getInstance();

      // Initialize orchestrator if needed
      if (!orchestrator.isReady()) {
        await orchestrator.initialize();
      }

      // Simulate incoming call wake-up
      const wakeUpSuccess = await orchestrator.wakeUpForIncomingCall({
        sessionId,
        meetingId: `test-meeting-${Date.now()}`,
        token: `test-token-${Date.now()}`,
        callerName: 'Test Caller',
        callType: scenario.callType,
      });

      const actualTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = performanceMonitor.getCurrentMetrics();
      if (metrics) {
        serviceMetrics = metrics.serviceInitTimes;
      }

      // Determine performance grade
      let performanceGrade: 'excellent' | 'good' | 'poor';
      if (actualTime <= scenario.expectedMaxTime * 0.6) {
        performanceGrade = 'excellent';
      } else if (actualTime <= scenario.expectedMaxTime) {
        performanceGrade = 'good';
      } else {
        performanceGrade = 'poor';
      }

      return {
        scenario,
        success: wakeUpSuccess,
        actualTime,
        errors,
        performanceGrade,
        serviceMetrics,
      };

    } catch (error) {
      const actualTime = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message : String(error));

      return {
        scenario,
        success: false,
        actualTime,
        errors,
        performanceGrade: 'poor',
        serviceMetrics,
      };
    }
  }

  /**
   * Simulate test conditions (network, memory, etc.)
   */
  private async simulateTestConditions(scenario: TestScenario): Promise<void> {
    Logger.info('KilledStateTestingUtils', `🎭 Simulating conditions for: ${scenario.name}`);

    // Simulate network conditions
    if (scenario.networkCondition === 'poor') {
      // Add artificial delay to simulate poor network
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else if (scenario.networkCondition === 'offline') {
      // TODO: Implement offline simulation
      Logger.warn('KilledStateTestingUtils', 'Offline simulation not implemented');
    }

    // Simulate device conditions
    if (scenario.deviceCondition === 'low_memory') {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      // Add delay to simulate memory pressure
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (scenario.deviceCondition === 'low_battery') {
      // TODO: Implement battery simulation
      Logger.warn('KilledStateTestingUtils', 'Low battery simulation not implemented');
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const successRate = (successfulTests / totalTests) * 100;

    const averageTime = this.testResults.reduce((sum, r) => sum + r.actualTime, 0) / totalTests;
    
    const gradeDistribution = this.testResults.reduce((acc, r) => {
      acc[r.performanceGrade] = (acc[r.performanceGrade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const report = {
      summary: {
        totalTests,
        successfulTests,
        successRate: `${successRate.toFixed(1)}%`,
        averageTime: `${averageTime.toFixed(0)}ms`,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      },
      gradeDistribution,
      detailedResults: this.testResults.map(r => ({
        scenario: r.scenario.name,
        success: r.success,
        time: `${r.actualTime}ms`,
        grade: r.performanceGrade,
        errors: r.errors,
      })),
      recommendations: this.generateRecommendations(),
    };

    Logger.info('KilledStateTestingUtils', '📊 KILLED STATE TEST REPORT', report);
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedTests = this.testResults.filter(r => !r.success);
    const slowTests = this.testResults.filter(r => r.performanceGrade === 'poor');

    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} tests failed - review error handling`);
    }

    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests were slow - optimize service initialization`);
    }

    const videoCallResults = this.testResults.filter(r => r.scenario.callType === 'video');
    const avgVideoTime = videoCallResults.reduce((sum, r) => sum + r.actualTime, 0) / videoCallResults.length;
    
    if (avgVideoTime > 7000) {
      recommendations.push('Video call initialization is slow - consider VideoSDK optimization');
    }

    const poorNetworkResults = this.testResults.filter(r => r.scenario.networkCondition === 'poor');
    const poorNetworkFailures = poorNetworkResults.filter(r => !r.success).length;
    
    if (poorNetworkFailures > 0) {
      recommendations.push('Poor network conditions cause failures - improve network error handling');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed within acceptable thresholds');
    }

    return recommendations;
  }

  /**
   * Test specific service initialization
   */
  public async testServiceInitialization(serviceName: 'firebase' | 'videoSDK'): Promise<{
    success: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      Logger.info('KilledStateTestingUtils', `🧪 Testing ${serviceName} initialization`);
      
      if (serviceName === 'firebase') {
        const firebaseService = FirebaseService.getInstance();
        const success = await firebaseService.initializeMessaging();
        const duration = Date.now() - startTime;
        
        return { success, duration };
      } else if (serviceName === 'videoSDK') {
        const videoSDKService = VideoSDKService.getInstance();
        const success = await videoSDKService.ensureInitialized();
        const duration = Date.now() - startTime;
        
        return { success, duration };
      }
      
      throw new Error(`Unknown service: ${serviceName}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get test results
   */
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * Clear test results
   */
  public clearTestResults(): void {
    this.testResults = [];
    Logger.info('KilledStateTestingUtils', 'Test results cleared');
  }

  /**
   * Check if currently in testing mode
   */
  public isInTestingMode(): boolean {
    return this.isTestingMode;
  }
}

export default KilledStateTestingUtils;
