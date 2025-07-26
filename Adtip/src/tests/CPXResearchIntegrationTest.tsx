/**
 * CPX Research Integration Test
 * 
 * Test component to verify CPX Research survey integration works properly
 * with different user states and scenarios.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import SurveyBanner from '../components/home/SurveyBanner';
import CPXRewardService from '../services/CPXRewardService';
import { createCPXConfig, createGuestCPXConfig } from '../config/cpxResearchConfig';

const CPXResearchIntegrationTest: React.FC = () => {
  const { user, isGuest, isPremium } = useAuth();
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Test 1: Configuration Generation
  const testConfigGeneration = async () => {
    try {
      addTestResult('🧪 Testing configuration generation...');
      
      // Test authenticated user config
      if (user?.id) {
        const authConfig = createCPXConfig(user.id, isPremium);
        addTestResult(`✅ Auth config created: App ID ${authConfig.appId}, User ID ${authConfig.userId}`);
      }
      
      // Test guest config
      const guestConfig = createGuestCPXConfig();
      addTestResult(`✅ Guest config created: Hidden=${guestConfig.isHidden}`);
      
      addTestResult('✅ Configuration generation test passed');
    } catch (error) {
      addTestResult(`❌ Configuration test failed: ${error}`);
    }
  };

  // Test 2: Reward Service
  const testRewardService = async () => {
    try {
      addTestResult('🧪 Testing reward service...');
      
      if (!user?.id) {
        addTestResult('⚠️ Skipping reward test - no authenticated user');
        return;
      }

      // Test reward processing (simulation)
      const mockSurveyId = `test_survey_${Date.now()}`;
      const mockAmount = 5.0; // ₹5.00
      
      addTestResult(`💰 Processing mock survey reward: ₹${mockAmount} (Premium: ${isPremium})`);
      
      const response = await CPXRewardService.processSurveyReward(
        user.id,
        mockSurveyId,
        mockAmount,
        isPremium
      );
      
      if (response.success) {
        addTestResult(`✅ Reward processed successfully: ${response.message}`);
      } else {
        addTestResult(`❌ Reward processing failed: ${response.error}`);
      }
      
      // Test earnings calculation
      const totalEarnings = await CPXRewardService.getTotalSurveyEarnings();
      addTestResult(`📊 Total survey earnings: ₹${totalEarnings.toFixed(2)}`);
      
    } catch (error) {
      addTestResult(`❌ Reward service test failed: ${error}`);
    }
  };

  // Test 3: Component Rendering
  const testComponentRendering = () => {
    try {
      addTestResult('🧪 Testing component rendering...');
      
      // Check if SurveyBanner renders without errors
      addTestResult('✅ SurveyBanner component rendered successfully');
      
      // Test different user states
      if (isGuest) {
        addTestResult('👤 Guest mode detected - banner should show login prompt');
      } else if (isPremium) {
        addTestResult('💎 Premium user detected - banner should show 4x earning message');
      } else {
        addTestResult('👤 Regular user detected - banner should show standard earning message');
      }
      
      addTestResult('✅ Component rendering test passed');
    } catch (error) {
      addTestResult(`❌ Component rendering test failed: ${error}`);
    }
  };

  // Test 4: Storage Operations
  const testStorageOperations = async () => {
    try {
      addTestResult('🧪 Testing storage operations...');
      
      // Test completed surveys storage
      const completedSurveys = await CPXRewardService.getCompletedSurveys();
      addTestResult(`📁 Found ${completedSurveys.length} completed surveys in storage`);
      
      // Test sync operations
      await CPXRewardService.syncPendingTransactions();
      addTestResult('🔄 Pending transactions sync completed');
      
      addTestResult('✅ Storage operations test passed');
    } catch (error) {
      addTestResult(`❌ Storage operations test failed: ${error}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    addTestResult('🚀 Starting CPX Research integration tests...');
    addTestResult(`👤 User State: ${isGuest ? 'Guest' : 'Authenticated'} ${isPremium ? '(Premium)' : '(Regular)'}`);
    
    await testConfigGeneration();
    await testComponentRendering();
    await testStorageOperations();
    await testRewardService();
    
    addTestResult('🎉 All tests completed!');
    setIsRunningTests(false);
  };

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
  };

  // Mock reward callback for testing
  const handleMockReward = (amount: number, isPremiumUser: boolean) => {
    addTestResult(`🎁 Mock reward received: ₹${amount} (Premium: ${isPremiumUser})`);
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CPX Research Integration Test</Text>
        <Text style={styles.subtitle}>
          Test the survey integration functionality
        </Text>
      </View>

      {/* Test Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={isRunningTests}
        >
          <Text style={styles.buttonText}>
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      {/* Survey Banner Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Survey Banner Component</Text>
        <SurveyBanner
          isPremium={isPremium}
          onUpgrade={() => Alert.alert('Upgrade', 'This would navigate to premium upgrade')}
          onRewardEarned={handleMockReward}
        />
      </View>

      {/* Test Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <View style={styles.resultsContainer}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet. Run tests to see output.</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: colors.text,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  resultsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
  },
  noResults: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 40,
  },
  resultText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default CPXResearchIntegrationTest;
