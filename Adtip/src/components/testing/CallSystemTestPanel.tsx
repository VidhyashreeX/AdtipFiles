import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native'
import { useTheme } from '../../hooks/useTheme'
import CallSystemValidator from '../../services/calling/CallSystemValidator'
import CallController from '../../services/calling/CallController'
import NotificationService from '../../services/calling/NotificationService'
import NotificationPersistenceService from '../../services/calling/NotificationPersistenceService'
import { useCallStore } from '../../stores/callStoreSimplified'

const CallSystemTestPanel: React.FC = () => {
  const { colors, isDarkMode } = useTheme()
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<string>('')
  const callStore = useCallStore()

  const handleValidateSystem = async () => {
    setIsValidating(true)
    try {
      const validator = CallSystemValidator.getInstance()
      await validator.validateCallSystem()
      await validator.showValidationResults()
      setLastValidation(new Date().toLocaleTimeString())
    } catch (error) {
      Alert.alert('Validation Error', 'Failed to validate call system: ' + error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleTestIncomingCall = async () => {
    try {
      const notificationService = NotificationService.getInstance()
      const testSessionId = 'test-' + Date.now()
      
      await notificationService.showIncomingCall(
        testSessionId,
        'Test Caller',
        'voice',
        'test-meeting-id',
        'test-token'
      )
      
      Alert.alert('Test Sent', 'Test incoming call notification sent')
    } catch (error) {
      Alert.alert('Test Failed', 'Failed to send test notification: ' + error)
    }
  }

  const handleTestPersistence = async () => {
    try {
      const persistenceService = NotificationPersistenceService.getInstance()
      
      // Add a test pending call
      await persistenceService.addPendingCall({
        sessionId: 'persistence-test-' + Date.now(),
        callerName: 'Persistence Test',
        callType: 'video'
      })
      
      const stats = await persistenceService.getStatistics()
      Alert.alert('Persistence Test', `Added test call. Current stats: ${JSON.stringify(stats)}`)
    } catch (error) {
      Alert.alert('Test Failed', 'Persistence test failed: ' + error)
    }
  }

  const handleClearPersistence = async () => {
    try {
      const persistenceService = NotificationPersistenceService.getInstance()
      await persistenceService.clearAllPendingCalls()
      Alert.alert('Cleared', 'All pending calls cleared')
    } catch (error) {
      Alert.alert('Clear Failed', 'Failed to clear pending calls: ' + error)
    }
  }

  const handleResetCallStore = () => {
    try {
      callStore.actions.reset()
      Alert.alert('Reset', 'Call store reset successfully')
    } catch (error) {
      Alert.alert('Reset Failed', 'Failed to reset call store: ' + error)
    }
  }

  const handleTestOutgoingCall = async () => {
    try {
      const controller = CallController.getInstance()
      
      Alert.alert(
        'Test Outgoing Call',
        'This will attempt to start a test call. Make sure you have a valid recipient ID.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Test Voice Call',
            onPress: async () => {
              const success = await controller.startCall('test-recipient', 'Test Recipient', 'voice')
              Alert.alert('Test Result', success ? 'Call started successfully' : 'Call failed to start')
            }
          }
        ]
      )
    } catch (error) {
      Alert.alert('Test Failed', 'Outgoing call test failed: ' + error)
    }
  }

  const TestButton: React.FC<{
    title: string
    onPress: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'danger'
  }> = ({ title, onPress, disabled = false, variant = 'primary' }) => {
    const getButtonStyle = () => {
      const baseStyle = [styles.button]
      
      if (disabled) {
        baseStyle.push({ backgroundColor: colors.text.disabled })
      } else {
        switch (variant) {
          case 'primary':
            baseStyle.push({ backgroundColor: colors.primary })
            break
          case 'secondary':
            baseStyle.push({ backgroundColor: colors.secondary })
            break
          case 'danger':
            baseStyle.push({ backgroundColor: colors.error })
            break
        }
      }
      
      return baseStyle
    }

    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, { color: colors.text.primary }]}>
          {title}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Call System Test Panel
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Platform: {Platform.OS} | Last Validation: {lastValidation || 'Never'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          System Validation
        </Text>
        <TestButton
          title={isValidating ? 'Validating...' : 'Validate Call System'}
          onPress={handleValidateSystem}
          disabled={isValidating}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Notification Tests
        </Text>
        <TestButton
          title="Test Incoming Call Notification"
          onPress={handleTestIncomingCall}
          variant="secondary"
        />
        <TestButton
          title="Test Persistence System"
          onPress={handleTestPersistence}
          variant="secondary"
        />
        <TestButton
          title="Clear Pending Calls"
          onPress={handleClearPersistence}
          variant="danger"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Call Flow Tests
        </Text>
        <TestButton
          title="Test Outgoing Call"
          onPress={handleTestOutgoingCall}
          variant="secondary"
        />
        <TestButton
          title="Reset Call Store"
          onPress={handleResetCallStore}
          variant="danger"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Current Call State
        </Text>
        <View style={[styles.stateContainer, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.stateText, { color: colors.text.secondary }]}>
            Status: {callStore.status}
          </Text>
          <Text style={[styles.stateText, { color: colors.text.secondary }]}>
            Session: {callStore.session ? callStore.session.sessionId : 'None'}
          </Text>
          <Text style={[styles.stateText, { color: colors.text.secondary }]}>
            Media: Mic {callStore.media.mic ? 'ON' : 'OFF'} | Cam {callStore.media.cam ? 'ON' : 'OFF'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text.disabled }]}>
          This panel is for testing and debugging the call system.
          Use in development only.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stateContainer: {
    padding: 12,
    borderRadius: 8,
  },
  stateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

export default CallSystemTestPanel
