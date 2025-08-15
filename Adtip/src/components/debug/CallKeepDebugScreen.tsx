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

    // First check phone account status
    addLog('🔍 Checking phone account status...')
    const phoneAccountStatus = await callKeepService.checkPhoneAccountStatus()
    addLog(`📱 Phone Account Status: ${phoneAccountStatus.statusMessage}`)
    addLog(`✅ Has Phone Account: ${phoneAccountStatus.hasPhoneAccount}`)
    addLog(`🔧 CallKeep Available: ${phoneAccountStatus.isCallKeepAvailable}`)
    addLog(`📞 Can Display Calls: ${phoneAccountStatus.canDisplayCalls}`)

    if (!phoneAccountStatus.canDisplayCalls) {
      addLog('❌ Cannot display calls - check phone account permissions')
      if (!phoneAccountStatus.hasPhoneAccount) {
        addLog('💡 Enable phone account: Settings > Apps > Adtip > Phone Account')
      }
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

    if (result) {
      addLog('✅ CallKeep UI should now be visible!')
    } else {
      addLog('❌ CallKeep UI failed to display')
    }

    // End the test call after 5 seconds
    setTimeout(() => {
      callKeepService.endCall(uuid)
      addLog('📞 Test call ended')
    }, 5000)
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
          style={[styles.button, styles.infoButton]}
          onPress={() => runTest('Phone Account Status', async () => {
            const callKeepService = CallKeepService.getInstance()
            const status = await callKeepService.checkPhoneAccountStatus()
            addLog('📱 Phone Account Status Check:')
            addLog(`✅ Has Phone Account: ${status.hasPhoneAccount}`)
            addLog(`🔧 CallKeep Available: ${status.isCallKeepAvailable}`)
            addLog(`📞 Can Display Calls: ${status.canDisplayCalls}`)
            addLog(`💬 Status: ${status.statusMessage}`)
          })}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Check Phone Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={() => runTest('Refresh Phone Account', async () => {
            const callKeepService = CallKeepService.getInstance()
            addLog('🔄 Refreshing phone account status...')
            const success = await callKeepService.refreshPhoneAccountStatus()
            if (success) {
              addLog('✅ Phone account refreshed successfully!')
              addLog('📞 Try the incoming call test again')
            } else {
              addLog('❌ Phone account refresh failed')
              addLog('💡 You may need to enable it manually in Settings')
            }
          })}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Refresh Account</Text>
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
  infoButton: {
    backgroundColor: '#5856D6',
  },
  refreshButton: {
    backgroundColor: '#32D74B',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
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
