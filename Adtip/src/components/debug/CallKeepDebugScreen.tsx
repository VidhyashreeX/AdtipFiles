import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native'
import { CallKeepService } from '../../services/calling/CallKeepService'
import { CallKeepDebugger } from '../../utils/callKeepDebugger'
import { CallKeepPermissionGuide } from '../callkeep/CallKeepPermissionGuide'

/**
 * Debug screen for testing CallKeep functionality
 * Add this to your navigation stack temporarily for debugging
 */
export const CallKeepDebugScreen: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPermissionGuide, setShowPermissionGuide] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    setIsLoading(true)
    addLog(`🚀 Starting ${testName}...`)
    
    try {
      await testFunction()
      addLog(`✅ ${testName} completed`)
    } catch (error) {
      addLog(`❌ ${testName} failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testCallKeepService = async () => {
    const callKeepService = CallKeepService.getInstance()
    addLog('📱 Testing CallKeepService initialization...')
    
    const result = await callKeepService.initialize()
    addLog(`📋 Initialization result: ${result}`)
    addLog(`📋 Is available: ${callKeepService.isAvailable()}`)
  }

  const testBasicSetup = async () => {
    addLog('🔧 Testing basic CallKeep setup...')
    const result = await CallKeepDebugger.testBasicSetup()
    addLog(`📋 Basic setup result: ${result}`)
  }

  const runDiagnostics = async () => {
    addLog('🔍 Running comprehensive diagnostics...')
    await CallKeepDebugger.runDiagnostics()
    addLog('📋 Check console for detailed diagnostics')
  }

  const testPermissions = async () => {
    addLog('🔐 Testing permissions...')
    await CallKeepDebugger.testPermissions()
    addLog('📋 Permission test completed')
  }

  const testIncomingCall = async () => {
    const callKeepService = CallKeepService.getInstance()
    if (!callKeepService.isAvailable()) {
      addLog('❌ CallKeep not available for incoming call test')
      return
    }

    addLog('📞 Testing incoming call display...')
    const uuid = 'test-' + Date.now()
    const result = await callKeepService.displayIncomingCall(
      uuid,
      '+1234567890',
      'Test Caller'
    )
    addLog(`📋 Incoming call result: ${result}`)

    // End the test call after 3 seconds
    setTimeout(() => {
      callKeepService.endCall(uuid)
      addLog('📞 Test call ended')
    }, 3000)
  }

  const enableVivoTesting = async () => {
    addLog('⚠️ WARNING: Enabling CallKeep on Vivo device for testing')
    addLog('⚠️ This may cause blank screen - be ready to force close app!')

    // Enable Vivo CallKeep
    CallKeepService.enableVivoCallKeepForTesting()
    addLog('🔧 Vivo CallKeep enabled for testing')

    // Try to reinitialize
    const callKeepService = CallKeepService.getInstance()
    // Reset the service to allow reinitialization
    callKeepService['isInitialized'] = false
    callKeepService['initializationAttempts'] = 0

    addLog('🔄 Attempting to reinitialize CallKeep...')
    const result = await callKeepService.initialize()
    addLog(`📋 Reinitialization result: ${result}`)
  }

  const disableVivoCallKeep = async () => {
    addLog('🚫 Disabling CallKeep for Vivo device')
    CallKeepService.disableVivoCallKeep()
    addLog('✅ Vivo CallKeep disabled - app should be stable')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CallKeep Debug Console</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => runTest('CallKeep Service Test', testCallKeepService)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test CallKeep Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => runTest('Basic Setup Test', testBasicSetup)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Basic Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => runTest('Diagnostics', runDiagnostics)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run Diagnostics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => runTest('Permissions Test', testPermissions)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={() => runTest('Incoming Call Test', testIncomingCall)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Incoming Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.permissionButton]}
          onPress={() => setShowPermissionGuide(true)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Setup Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={() => runTest('Enable Vivo Testing', enableVivoTesting)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>⚠️ Enable Vivo Testing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.safeButton]}
          onPress={() => runTest('Disable Vivo CallKeep', disableVivoCallKeep)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🚫 Disable Vivo CallKeep</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyText}>No logs yet. Run a test to see results.</Text>
        )}
      </ScrollView>

      <CallKeepPermissionGuide
        visible={showPermissionGuide}
        onClose={() => setShowPermissionGuide(false)}
        onPermissionGranted={() => {
          addLog('✅ CallKeep permissions granted successfully!')
          setShowPermissionGuide(false)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  permissionButton: {
    backgroundColor: '#5856D6',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  safeButton: {
    backgroundColor: '#30D158',
  },
  clearButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  logText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
})
