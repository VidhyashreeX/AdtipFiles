/**
 * Client-Side Transaction Test Runner Component
 * 
 * This component provides a UI for testing the new client-side transaction
 * management system for call billing.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ClientSideTransactionManager } from '../../services/calling/ClientSideTransactionManager';
import { CallBillingService } from '../../services/calling/CallBillingService';

interface TransactionTestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

const ClientTransactionTestRunner: React.FC = () => {
  const { colors } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TransactionTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [clientSideEnabled, setClientSideEnabled] = useState(true); // ENABLED by default
  const [transactionStatus, setTransactionStatus] = useState<any>(null);

  const transactionManager = ClientSideTransactionManager.getInstance();
  const billingService = CallBillingService.getInstance();

  useEffect(() => {
    // Update billing service setting
    billingService.setClientSideTransactions(clientSideEnabled);
    
    // Get current transaction status
    const status = billingService.getClientSideTransactionStatus();
    setTransactionStatus(status);
  }, [clientSideEnabled]);

  const runTransactionTest = async (testType: 'voice' | 'video' | 'premium' | 'rollback') => {
    setIsRunning(true);
    setCurrentTest(testType);
    
    const startTime = Date.now();
    
    try {
      let result: TransactionTestResult;
      
      switch (testType) {
        case 'voice':
          result = await testVoiceCallTransactions();
          break;
        case 'video':
          result = await testVideoCallTransactions();
          break;
        case 'premium':
          result = await testPremiumCallTransactions();
          break;
        case 'rollback':
          result = await testTransactionRollback();
          break;
        default:
          throw new Error('Unknown test type');
      }
      
      setTestResults(prev => [...prev, result]);
      
      Alert.alert(
        'Test Complete',
        `${result.testName}: ${result.success ? 'PASSED' : 'FAILED'}\nDuration: ${result.duration}ms${result.error ? `\nError: ${result.error}` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TransactionTestResult = {
        testName: `${testType} Transaction Test`,
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
      
      setTestResults(prev => [...prev, result]);
      Alert.alert('Test Error', `Failed to run ${testType} test: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      
      // Update transaction status
      const status = billingService.getClientSideTransactionStatus();
      setTransactionStatus(status);
    }
  };

  const testVoiceCallTransactions = async (): Promise<TransactionTestResult> => {
    const startTime = Date.now();
    
    try {
      const callId = `test-voice-${Date.now()}`;
      const callerId = 'test-caller-123';
      const receiverId = 'test-receiver-456';
      
      // Start call tracking
      await transactionManager.startCallTracking(
        callId,
        callerId,
        receiverId,
        'voice',
        false, // caller not premium
        false  // receiver not premium
      );
      
      // Simulate 30 seconds of call
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds for testing
      
      // Check balance
      const balanceCheck = await transactionManager.checkCallerBalance();
      
      // Stop call tracking
      const completedCall = await transactionManager.stopCallTracking();
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Voice Call Transaction Test',
        success: true,
        duration,
        details: {
          callId,
          completedCall,
          balanceCheck,
          callType: 'voice',
          premiumStatus: { caller: false, receiver: false }
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Voice Call Transaction Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testVideoCallTransactions = async (): Promise<TransactionTestResult> => {
    const startTime = Date.now();
    
    try {
      const callId = `test-video-${Date.now()}`;
      const callerId = 'test-caller-789';
      const receiverId = 'test-receiver-012';
      
      // Start call tracking
      await transactionManager.startCallTracking(
        callId,
        callerId,
        receiverId,
        'video',
        false, // caller not premium
        true   // receiver is premium
      );
      
      // Simulate call duration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check balance
      const balanceCheck = await transactionManager.checkCallerBalance();
      
      // Stop call tracking
      const completedCall = await transactionManager.stopCallTracking();
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Video Call Transaction Test',
        success: true,
        duration,
        details: {
          callId,
          completedCall,
          balanceCheck,
          callType: 'video',
          premiumStatus: { caller: false, receiver: true }
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Video Call Transaction Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testPremiumCallTransactions = async (): Promise<TransactionTestResult> => {
    const startTime = Date.now();
    
    try {
      const callId = `test-premium-${Date.now()}`;
      const callerId = 'test-caller-premium';
      const receiverId = 'test-receiver-premium';
      
      // Start call tracking with both premium
      await transactionManager.startCallTracking(
        callId,
        callerId,
        receiverId,
        'voice',
        true, // caller is premium
        true  // receiver is premium
      );
      
      // Simulate call duration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check balance
      const balanceCheck = await transactionManager.checkCallerBalance();
      
      // Stop call tracking
      const completedCall = await transactionManager.stopCallTracking();
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Premium Call Transaction Test',
        success: true,
        duration,
        details: {
          callId,
          completedCall,
          balanceCheck,
          callType: 'voice',
          premiumStatus: { caller: true, receiver: true }
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Premium Call Transaction Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testTransactionRollback = async (): Promise<TransactionTestResult> => {
    const startTime = Date.now();
    
    try {
      const callId = `test-rollback-${Date.now()}`;
      const callerId = 'test-caller-rollback';
      const receiverId = 'test-receiver-rollback';
      
      // Start call tracking
      await transactionManager.startCallTracking(
        callId,
        callerId,
        receiverId,
        'video',
        false,
        false
      );
      
      // Simulate some call time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate call failure and rollback
      await transactionManager.rollbackCallTransactions(callId);
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Transaction Rollback Test',
        success: true,
        duration,
        details: {
          callId,
          rollbackCompleted: true
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Transaction Rollback Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const renderTestResult = (result: TransactionTestResult, index: number) => (
    <View key={index} style={[styles.resultCard, { backgroundColor: colors.surface }]}>
      <View style={styles.resultHeader}>
        <Text style={[styles.testName, { color: colors.text }]}>{result.testName}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: result.success ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {result.success ? 'PASS' : 'FAIL'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.duration, { color: colors.textSecondary }]}>
        Duration: {result.duration}ms
      </Text>
      
      {result.error && (
        <Text style={[styles.error, { color: '#F44336' }]}>
          Error: {result.error}
        </Text>
      )}
      
      {result.details && Object.keys(result.details).length > 0 && (
        <View style={styles.details}>
          <Text style={[styles.detailsTitle, { color: colors.text }]}>Details:</Text>
          <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
            {JSON.stringify(result.details, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Client-Side Transaction Test Runner
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Test real-time call transaction management (ENABLED)
      </Text>

      <View style={styles.settingsContainer}>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Client-Side Transactions
          </Text>
          <Switch
            value={clientSideEnabled}
            onValueChange={setClientSideEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={clientSideEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        {transactionStatus && (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Status:</Text>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Enabled: {transactionStatus.enabled ? 'Yes' : 'No'}
            </Text>
            {transactionStatus.activeCall && (
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                Active Call: {transactionStatus.activeCall.callId}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runTransactionTest('voice')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Voice Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runTransactionTest('video')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Video Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runTransactionTest('premium')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Premium Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF5722' }]}
          onPress={() => runTransactionTest('rollback')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Rollback</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF9800' }]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {isRunning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Running {currentTest} test...
          </Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          Test Results ({testResults.length})
        </Text>
        
        {testResults.map((result, index) => renderTestResult(result, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  settingsContainer: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    marginBottom: 2,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 14,
    marginBottom: 4,
  },
  error: {
    fontSize: 14,
    marginBottom: 8,
  },
  details: {
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default ClientTransactionTestRunner;
