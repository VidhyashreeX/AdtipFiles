import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Modal
} from 'react-native'
import { CallKeepService } from '../../services/calling/CallKeepService'

interface CallKeepPermissionGuideProps {
  visible: boolean
  onClose: () => void
  onPermissionGranted?: () => void
}

/**
 * Component to guide users through enabling CallKeep permissions
 */
export const CallKeepPermissionGuide: React.FC<CallKeepPermissionGuideProps> = ({
  visible,
  onClose,
  onPermissionGranted
}) => {
  const [isChecking, setIsChecking] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)

  const checkPermissions = async () => {
    setIsChecking(true)
    try {
      const callKeepService = CallKeepService.getInstance()
      const permissions = await callKeepService.hasRequiredPermissions()
      setHasPermissions(permissions)
      
      if (permissions && onPermissionGranted) {
        onPermissionGranted()
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (visible) {
      checkPermissions()
    }
  }, [visible])

  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings().catch(() => {
        Alert.alert(
          'Cannot Open Settings',
          'Please manually open Settings > Apps > Adtip > Phone Account and enable it.'
        )
      })
    }
  }

  const handleRetryPermissions = async () => {
    setIsChecking(true)
    try {
      const callKeepService = CallKeepService.getInstance()
      
      // Try to re-register phone account
      await callKeepService.registerPhoneAccountWithGuidance()
      
      // Check permissions again
      await checkPermissions()
      
    } catch (error) {
      console.error('Error retrying permissions:', error)
      Alert.alert(
        'Permission Setup Failed',
        'Please follow the manual steps to enable phone account permissions.'
      )
    } finally {
      setIsChecking(false)
    }
  }

  if (Platform.OS !== 'android') {
    return null // iOS handles permissions automatically
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Enable Native Call Interface</Text>
          
          {hasPermissions ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>
                CallKeep permissions are enabled! You'll now see incoming calls in your phone's native interface.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Great!</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.description}>
                To show incoming calls in your phone's native interface, Adtip needs phone account permissions.
              </Text>

              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Manual Setup Steps:</Text>
                <Text style={styles.step}>1. Tap "Open Settings" below</Text>
                <Text style={styles.step}>2. Find and tap "Adtip" in the app list</Text>
                <Text style={styles.step}>3. Look for "Phone Account" or "Calling accounts"</Text>
                <Text style={styles.step}>4. Toggle it ON to enable</Text>
                <Text style={styles.step}>5. Return to the app</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={openAppSettings}
                >
                  <Text style={styles.buttonText}>Open Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleRetryPermissions}
                  disabled={isChecking}
                >
                  <Text style={styles.buttonText}>
                    {isChecking ? 'Checking...' : 'Try Auto-Setup'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.tertiaryButton]}
                  onPress={checkPermissions}
                  disabled={isChecking}
                >
                  <Text style={styles.buttonText}>
                    {isChecking ? 'Checking...' : 'Check Again'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Skip for Now</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.note}>
                Note: Without these permissions, you'll still receive calls but they'll use the app's custom interface instead of your phone's native interface.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  stepsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  step: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 6,
    paddingLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  tertiaryButton: {
    backgroundColor: '#FF9500',
  },
  skipButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
})
