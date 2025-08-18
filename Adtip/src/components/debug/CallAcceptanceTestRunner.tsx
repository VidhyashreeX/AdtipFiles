/**
 * Call Acceptance Test Runner Component
 * 
 * This component provides a UI for testing call acceptance functionality
 * across different app states to verify the fixes for blank screen issues.
 */

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
import { useTheme } from '../../contexts/ThemeContext';
import { KilledStateCallAcceptanceTest } from '../../utils/testKilledStateCallAcceptance';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

const CallAcceptanceTestRunner: React.FC = () => {
  const { colors } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  const testRunner = KilledStateCallAcceptanceTest.getInstance();

  const runSingleTest = async (testType: 'foreground' | 'background' | 'killed') => {
    setIsRunning(true);
    setCurrentTest(testType);
    
    try {
      let result: TestResult;
      
      switch (testType) {
        case 'foreground':
          result = await testRunner.testForegroundStateCallAcceptance();
          break;
        case 'background':
          result = await testRunner.testBackgroundStateCallAcceptance();
          break;
        case 'killed':
          result = await testRunner.testKilledStateCallAcceptance();
          break;
      }
      
      setTestResults(prev => [...prev, result]);
      
      Alert.alert(
        'Test Complete',
        `${result.testName}: ${result.success ? 'PASSED' : 'FAILED'}\nDuration: ${result.duration}ms${result.error ? `\nError: ${result.error}` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run ${testType} test: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTest('all');
    setTestResults([]);
    
    try {
      const results = await testRunner.runAllTests();
      setTestResults(results);
      
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      
      Alert.alert(
        'All Tests Complete',
        `Results: ${passed}/${total} tests passed`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run all tests: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    testRunner.clearTestResults();
  };

  const renderTestResult = (result: TestResult, index: number) => (
    <View key={index} style={[styles.resultCard, { backgroundColor: colors.surface }]}>
      <View style={styles.resultHeader}>
        <Text style={[styles.testName, { color: colors.text }]}>{result.testName}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: result.success ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {result.success ? 'PASSED' : 'FAILED'}
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
      
      {result.details && (
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
        Call Acceptance Test Runner
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Test call acceptance functionality across different app states
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runSingleTest('foreground')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Foreground</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runSingleTest('background')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Background</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runSingleTest('killed')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Killed State</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.runAllButton, { backgroundColor: '#4CAF50' }]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton, { backgroundColor: '#FF9800' }]}
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
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  runAllButton: {
    marginTop: 8,
  },
  clearButton: {
    marginTop: 4,
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
    fontSize: 18,
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
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default CallAcceptanceTestRunner;
