/**
 * Billing Logic Test Runner Component
 * 
 * This component provides a UI for testing billing logic to verify that
 * only caller balance affects call continuation, not receiver balance.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BillingLogicTest } from '../../utils/testBillingLogic';

interface BillingTestResult {
  testName: string;
  success: boolean;
  details: any;
  error?: string;
}

const BillingLogicTestRunner: React.FC = () => {
  const { colors } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<BillingTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  const testRunner = BillingLogicTest.getInstance();

  const runBillingTests = async () => {
    setIsRunning(true);
    setCurrentTest('billing logic');
    setTestResults([]);
    
    try {
      const results = await testRunner.runAllBillingTests();
      setTestResults(results);
      
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      
      Alert.alert(
        'Billing Tests Complete',
        `Results: ${passed}/${total} tests passed\n\nKey Finding: ${passed === total ? 'Billing logic is correctly implemented!' : 'Some billing issues detected.'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run billing tests: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const shareTestReport = async () => {
    try {
      const report = testRunner.generateTestReport();
      await Share.share({
        message: report,
        title: 'Billing Logic Test Report'
      });
    } catch (error) {
      Alert.alert('Share Error', `Failed to share report: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    testRunner.clearTestResults();
  };

  const renderTestResult = (result: BillingTestResult, index: number) => (
    <View key={index} style={[styles.resultCard, { backgroundColor: colors.surface }]}>
      <View style={styles.resultHeader}>
        <Text style={[styles.testName, { color: colors.text }]} numberOfLines={2}>
          {result.testName}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: result.success ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {result.success ? 'PASS' : 'FAIL'}
          </Text>
        </View>
      </View>
      
      {result.error && (
        <Text style={[styles.error, { color: '#F44336' }]}>
          Error: {result.error}
        </Text>
      )}
      
      {result.details && (
        <View style={styles.details}>
          <Text style={[styles.detailsTitle, { color: colors.text }]}>Key Details:</Text>
          {result.details.scenario && (
            <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
              Scenario: {result.details.scenario.description}
            </Text>
          )}
          {result.details.actualResult && result.details.expectedResult && (
            <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
              Expected: {result.details.expectedResult}, Got: {result.details.actualResult}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const getTestSummary = () => {
    if (testResults.length === 0) return null;
    
    const passed = testResults.filter(r => r.success).length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Test Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Tests:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{total}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Passed:</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{passed}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Failed:</Text>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>{total - passed}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pass Rate:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{passRate}%</Text>
        </View>
        
        <View style={[styles.conclusionCard, { 
          backgroundColor: passed === total ? '#E8F5E8' : '#FFF3E0',
          borderColor: passed === total ? '#4CAF50' : '#FF9800'
        }]}>
          <Text style={[styles.conclusionText, { 
            color: passed === total ? '#2E7D32' : '#F57C00'
          }]}>
            {passed === total 
              ? '✅ Billing logic is correctly implemented! Only caller balance affects calls.'
              : '⚠️ Some billing issues detected. Review failed tests for details.'
            }
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Billing Logic Test Runner
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Verify that only caller balance affects call continuation
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={runBillingTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Run Billing Tests</Text>
        </TouchableOpacity>

        {testResults.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#2196F3' }]}
              onPress={shareTestReport}
              disabled={isRunning}
            >
              <Text style={styles.buttonText}>Share Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF9800' }]}
              onPress={clearResults}
              disabled={isRunning}
            >
              <Text style={styles.buttonText}>Clear Results</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {isRunning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Running {currentTest} tests...
          </Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer}>
        {getTestSummary()}
        
        {testResults.length > 0 && (
          <>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              Detailed Results ({testResults.length})
            </Text>
            
            {testResults.map((result, index) => renderTestResult(result, index))}
          </>
        )}
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
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  conclusionCard: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 12,
  },
  conclusionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
    marginBottom: 2,
  },
});

export default BillingLogicTestRunner;
