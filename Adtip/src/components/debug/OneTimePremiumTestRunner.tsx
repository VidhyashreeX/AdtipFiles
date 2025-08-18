/**
 * One-Time Premium Test Runner Component
 * 
 * This component provides a UI for testing the new one-time premium payment
 * system and ensuring backward compatibility with the subscription system.
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
import { useAuth } from '../../contexts/AuthContext';
import OneTimePremiumService, { PremiumPlan, PremiumStatus } from '../../services/OneTimePremiumService';
import ApiService from '../../services/ApiService';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

const OneTimePremiumTestRunner: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [useOneTimePayments, setUseOneTimePayments] = useState(true);

  const premiumService = OneTimePremiumService.getInstance();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      if (user?.id) {
        const [plans, status] = await Promise.all([
          premiumService.getPremiumPlans(),
          premiumService.getPremiumStatus(user.id)
        ]);
        setPremiumPlans(plans);
        setPremiumStatus(status);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const runTest = async (testType: string) => {
    setIsRunning(true);
    setCurrentTest(testType);
    
    const startTime = Date.now();
    
    try {
      let result: TestResult;
      
      switch (testType) {
        case 'plans':
          result = await testPremiumPlans();
          break;
        case 'status':
          result = await testPremiumStatus();
          break;
        case 'history':
          result = await testPremiumHistory();
          break;
        case 'compatibility':
          result = await testBackwardCompatibility();
          break;
        case 'caching':
          result = await testCaching();
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
      const result: TestResult = {
        testName: `${testType} Test`,
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
    }
  };

  const testPremiumPlans = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const plans = await premiumService.getPremiumPlans(true);
      
      // Validate plan structure
      const validPlans = plans.every(plan => 
        plan.id && 
        plan.name && 
        plan.duration_months > 0 && 
        plan.discounted_price > 0 &&
        Array.isArray(plan.features)
      );

      if (!validPlans) {
        throw new Error('Invalid plan structure detected');
      }

      // Check for popular plan
      const hasPopularPlan = plans.some(plan => plan.is_popular);
      
      // Check pricing logic
      const validPricing = plans.every(plan => 
        plan.discounted_price <= plan.original_price &&
        plan.savings_percentage >= 0
      );

      if (!validPricing) {
        throw new Error('Invalid pricing logic detected');
      }

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Premium Plans Test',
        success: true,
        duration,
        details: {
          plansCount: plans.length,
          hasPopularPlan,
          validStructure: validPlans,
          validPricing,
          plans: plans.map(p => ({
            id: p.id,
            name: p.name,
            duration: p.duration_months,
            price: p.discounted_price,
            savings: p.savings_percentage
          }))
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Premium Plans Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testPremiumStatus = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const status = await premiumService.getPremiumStatus(user.id, true);
      
      // Validate status structure
      const validStatus = typeof status.is_premium === 'boolean' &&
                         typeof status.days_remaining === 'number' &&
                         status.days_remaining >= 0;

      if (!validStatus) {
        throw new Error('Invalid status structure');
      }

      // Test expiry calculation
      const expiry = await premiumService.getPremiumExpiry(user.id);
      const validExpiry = typeof expiry.days_remaining === 'number';

      if (!validExpiry) {
        throw new Error('Invalid expiry calculation');
      }

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Premium Status Test',
        success: true,
        duration,
        details: {
          status,
          expiry,
          validStructure: validStatus,
          validExpiry
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Premium Status Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testPremiumHistory = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const history = await premiumService.getPremiumHistory(user.id, 1, 5);
      
      // Validate history structure
      const validHistory = Array.isArray(history.history) &&
                          typeof history.pagination === 'object' &&
                          typeof history.pagination.total === 'number';

      if (!validHistory) {
        throw new Error('Invalid history structure');
      }

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Premium History Test',
        success: true,
        duration,
        details: {
          historyCount: history.history.length,
          pagination: history.pagination,
          validStructure: validHistory
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Premium History Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testBackwardCompatibility = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Test both old and new API endpoints
      const [oldPlans, newPlans] = await Promise.all([
        ApiService.getSubscriptionPlans().catch(() => ({ status: false, data: [] })),
        ApiService.getOneTimePremiumPlans()
      ]);

      const hasOldPlans = oldPlans.status && Array.isArray(oldPlans.data);
      const hasNewPlans = newPlans.status && Array.isArray(newPlans.data);

      if (!hasNewPlans) {
        throw new Error('New one-time premium plans not available');
      }

      const duration = Date.now() - startTime;
      
      return {
        testName: 'Backward Compatibility Test',
        success: true,
        duration,
        details: {
          oldPlansAvailable: hasOldPlans,
          newPlansAvailable: hasNewPlans,
          oldPlansCount: hasOldPlans ? oldPlans.data.length : 0,
          newPlansCount: hasNewPlans ? newPlans.data.length : 0
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Backward Compatibility Test',
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const testCaching = async (): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      // Clear cache first
      premiumService.clearCache();
      
      // First call should hit API
      const start1 = Date.now();
      await premiumService.getPremiumPlans();
      const apiCallTime = Date.now() - start1;
      
      // Second call should use cache
      const start2 = Date.now();
      await premiumService.getPremiumPlans();
      const cacheCallTime = Date.now() - start2;
      
      // Cache should be significantly faster
      const cacheIsEffective = cacheCallTime < apiCallTime / 2;
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Caching Test',
        success: cacheIsEffective,
        duration,
        details: {
          apiCallTime,
          cacheCallTime,
          cacheIsEffective,
          speedImprovement: `${Math.round((apiCallTime / cacheCallTime) * 100) / 100}x`
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: 'Caching Test',
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

  const renderTestResult = (result: TestResult, index: number) => (
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
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        One-Time Premium Test Runner
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Test the new one-time premium payment system
      </Text>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>Current Status:</Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Premium: {premiumStatus?.is_premium ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Type: {premiumStatus?.premium_type || 'None'}
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Plans Available: {premiumPlans.length}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runTest('plans')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Premium Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runTest('status')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Premium Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => runTest('history')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Premium History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3' }]}
          onPress={() => runTest('compatibility')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Compatibility</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#9C27B0' }]}
          onPress={() => runTest('caching')}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Caching</Text>
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
  statusContainer: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
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
});

export default OneTimePremiumTestRunner;
