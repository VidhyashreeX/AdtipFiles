import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import Logger from '../../utils/LogUtils';

/**
 * OfflineCallTestScreen - Test interface for offline call functionality
 * 
 * This screen provides an easy way to test the offline call fix implementation
 * directly from the React Native app during development and QA.
 */

const OfflineCallTestScreen: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string>('');
  const [lastRunTime, setLastRunTime] = useState<string>('');

  const runOfflineCallTests = async () => {
    setIsRunning(true);
    setTestResults('Running offline call tests...\n\n');
    
    try {
      Logger.info('[OfflineCallTestScreen] Starting offline call tests...');
      
      // Import and run the test utility
      const { default: OfflineCallTestUtil } = await import('../../utils/OfflineCallTestUtil');
      const testUtil = OfflineCallTestUtil.getInstance();
      
      // Clear previous results
      testUtil.clearResults();
      
      // Run all tests
      const results = await testUtil.runAllTests();
      
      // Generate and display report
      const report = testUtil.generateReport();
      setTestResults(report);
      
      // Update last run time
      setLastRunTime(new Date().toLocaleString());
      
      // Show success/failure alert
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      
      if (passedCount === totalCount) {
        Alert.alert(
          '✅ All Tests Passed!', 
          `Offline call functionality is working correctly.\n\n${passedCount}/${totalCount} tests passed.`,
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        Alert.alert(
          '⚠️ Some Tests Failed', 
          `${passedCount}/${totalCount} tests passed.\n\nPlease check the detailed results below.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('[OfflineCallTestScreen] Test execution failed:', error);
      setTestResults(`❌ Test execution failed:\n\n${errorMessage}\n\nPlease check the logs for more details.`);
      
      Alert.alert(
        '❌ Test Execution Failed',
        errorMessage,
        [{ text: 'OK', style: 'destructive' }]
      );
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async (testName: string) => {
    setIsRunning(true);
    setTestResults(`Running ${testName} test...\n\n`);
    
    try {
      // Import test utility
      const { default: OfflineCallTestUtil } = await import('../../utils/OfflineCallTestUtil');
      const testUtil = OfflineCallTestUtil.getInstance();
      
      let result: string = '';
      
      // Run specific test based on name
      switch (testName) {
        case 'Call State Persistence':
          await (testUtil as any).testCallStatePersistence();
          break;
        case 'Call Recovery':
          await (testUtil as any).testCallStateRecovery();
          break;
        case 'Service Initialization':
          await (testUtil as any).testServiceInitialization();
          break;
        default:
          throw new Error(`Unknown test: ${testName}`);
      }
      
      // Get results
      const report = testUtil.generateReport();
      setTestResults(report);
      setLastRunTime(new Date().toLocaleString());
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('[OfflineCallTestScreen] Single test failed:', error);
      setTestResults(`❌ ${testName} test failed:\n\n${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults('');
    setLastRunTime('');
  };

  const simulateOfflineCall = async () => {
    setIsRunning(true);
    
    try {
      Logger.info('[OfflineCallTestScreen] Simulating offline call scenario...');
      
      // Import services
      const [
        { default: CallStatePersistenceService },
        { default: NotifeeCallHandler }
      ] = await Promise.all([
        import('../../services/calling/CallStatePersistenceService'),
        import('../../services/notification/NotifeeCallHandler')
      ]);
      
      const persistenceService = CallStatePersistenceService.getInstance();
      const notifeeHandler = NotifeeCallHandler.getInstance();
      
      // Initialize services
      await persistenceService.initialize();
      await notifeeHandler.initialize();
      
      // Create simulated call data
      const simulatedCall = {
        sessionId: `sim-${Date.now()}`,
        callerName: 'Simulated Test Caller',
        callType: 'video' as const,
        meetingId: `sim-meeting-${Date.now()}`,
        token: `sim-token-${Date.now()}`,
        callerId: 'sim-caller-123',
        receiverId: 'sim-receiver-456'
      };
      
      // Save call state (simulating FCM background handler)
      await persistenceService.saveCallState(simulatedCall);
      
      // Display notification (simulating killed state notification)
      const notificationSuccess = await notifeeHandler.displayIncomingCall(simulatedCall);
      
      if (notificationSuccess) {
        Alert.alert(
          '✅ Offline Call Simulation Success',
          'Call state has been persisted and notification displayed.\n\nThe call should be recoverable when the app resumes.',
          [
            { 
              text: 'Test Recovery', 
              onPress: async () => {
                // Test recovery
                const recoveredCall = await persistenceService.checkForCallRecovery();
                if (recoveredCall) {
                  Alert.alert(
                    '🔄 Call Recovery Success',
                    `Recovered call from: ${recoveredCall.callerName}\nCall Type: ${recoveredCall.callType}\nSession: ${recoveredCall.sessionId}`
                  );
                  await persistenceService.clearCallState();
                } else {
                  Alert.alert('❌ Recovery Failed', 'No call found for recovery.');
                }
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert('❌ Simulation Failed', 'Failed to display call notification.');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('[OfflineCallTestScreen] Offline call simulation failed:', error);
      Alert.alert('❌ Simulation Failed', errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Offline Call Test Suite</Text>
      <Text style={styles.subtitle}>
        Test the offline call fix implementation
      </Text>
      
      {lastRunTime && (
        <Text style={styles.lastRun}>Last run: {lastRunTime}</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runOfflineCallTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>🧪 Run All Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={simulateOfflineCall}
          disabled={isRunning}
        >
          <Text style={styles.secondaryButtonText}>📱 Simulate Offline Call</Text>
        </TouchableOpacity>

        <View style={styles.singleTestContainer}>
          <Text style={styles.singleTestTitle}>Quick Tests:</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.smallButton]}
            onPress={() => runSingleTest('Call State Persistence')}
            disabled={isRunning}
          >
            <Text style={styles.smallButtonText}>Persistence Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.smallButton]}
            onPress={() => runSingleTest('Call Recovery')}
            disabled={isRunning}
          >
            <Text style={styles.smallButtonText}>Recovery Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.smallButton]}
            onPress={() => runSingleTest('Service Initialization')}
            disabled={isRunning}
          >
            <Text style={styles.smallButtonText}>Service Test</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.clearButtonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={true}>
        <Text style={styles.resultsText}>{testResults}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  lastRun: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#999',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  smallButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 5,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  singleTestContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  singleTestTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
    color: '#333',
  },
});

export default OfflineCallTestScreen;