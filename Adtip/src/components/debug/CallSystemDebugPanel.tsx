/**
 * Call System Debug Panel
 * 
 * A debug component to test and verify call system functionality
 * Only shows in development builds
 */

import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import CallSystemTest from '../../utils/callSystemTest'

const CallSystemDebugPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Only show in development
  if (!__DEV__) {
    return null
  }

  const runSystemTest = async () => {
    setIsLoading(true)
    try {
      const results = await CallSystemTest.getInstance().testCallSystemStatus()
      setTestResults(results)
    } catch (error) {
      console.error('System test failed:', error)
      Alert.alert('Test Failed', 'Check console for details')
    } finally {
      setIsLoading(false)
    }
  }

  const simulateCall = async () => {
    try {
      const success = await CallSystemTest.getInstance().simulateIncomingCall('Debug Test Caller')
      if (success) {
        Alert.alert('Test Call Simulated', 'Check your notification panel for the incoming call')
      } else {
        Alert.alert('Simulation Failed', 'Check console for details')
      }
    } catch (error) {
      console.error('Call simulation failed:', error)
      Alert.alert('Simulation Error', 'Check console for details')
    }
  }

  const showRecommendations = () => {
    const recommendations = CallSystemTest.getInstance().getSetupRecommendations()
    Alert.alert(
      'Setup Recommendations',
      recommendations.join('\n\n'),
      [{ text: 'OK' }]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#4CAF50'
      case 'partial': return '#FF9800'
      case 'not_ready': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Call System Debug Panel</Text>
      <Text style={styles.subtitle}>Development Only</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runSystemTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : '🔍 Test System Status'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={simulateCall}
        >
          <Text style={styles.buttonText}>📞 Simulate Incoming Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={showRecommendations}
        >
          <Text style={styles.buttonText}>💡 Show Recommendations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={async () => {
            const status = await CallSystemTest.getInstance().checkPhoneAccountStatus()
            Alert.alert('Phone Account Status', status.statusMessage)
          }}
        >
          <Text style={styles.buttonText}>📱 Check Phone Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={() => CallSystemTest.getInstance().showCallKeepGuidance()}
        >
          <Text style={styles.buttonText}>🔧 Enable CallKeep</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Overall Status:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(testResults.overallStatus) }]}>
              {testResults.overallStatus.toUpperCase()}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>CallKeep Available:</Text>
            <Text style={[styles.statusValue, { color: testResults.callKeepStatus.isAvailable ? '#4CAF50' : '#FF9800' }]}>
              {testResults.callKeepStatus.isAvailable ? 'YES' : 'NO (Using Custom UI)'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Call Manager Ready:</Text>
            <Text style={[styles.statusValue, { color: testResults.reliableCallManagerReady ? '#4CAF50' : '#F44336' }]}>
              {testResults.reliableCallManagerReady ? 'YES' : 'NO'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Notifications Ready:</Text>
            <Text style={[styles.statusValue, { color: testResults.notificationChannelsReady ? '#4CAF50' : '#F44336' }]}>
              {testResults.notificationChannelsReady ? 'YES' : 'NO'}
            </Text>
          </View>

          {testResults.recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Recommendations:</Text>
              {testResults.recommendations.map((rec: string, index: number) => (
                <Text key={index} style={styles.recommendation}>• {rec}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    width: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    padding: 15,
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    marginBottom: 15,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  infoButton: {
    backgroundColor: '#FF9800',
  },
  warningButton: {
    backgroundColor: '#F44336',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultsContainer: {
    maxHeight: 300,
  },
  resultsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    flex: 1,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  recommendationsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  recommendationsTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendation: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 4,
  },
})

export default CallSystemDebugPanel
