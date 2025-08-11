import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import CallController from '../../services/calling/CallController';
import NotificationService from '../../services/calling/NotificationService';
import { CallKeepService } from '../../services/calling/CallKeepService';

/**
 * CallKeep Test Buttons Component
 * 
 * Provides test buttons for triggering incoming and outgoing native CallKeep UI
 * Only visible in debug builds (__DEV__ === true)
 * Positioned at top left of screen
 */
const CallKeepTestButtons: React.FC = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Only show in debug builds
  if (!__DEV__) {
    return null;
  }

  /**
   * Test incoming call with native CallKeep UI
   */
  const handleTestIncomingCall = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('[CallKeepTestButtons] Testing incoming call with native UI...');
      
      // Generate test data
      const testSessionId = 'test-incoming-' + Date.now();
      const testCallerName = 'Test Caller';
      const testMeetingId = 'test-meeting-' + Date.now();
      const testToken = 'test-token-' + Date.now();

      // First try direct CallKeep service for native UI
      const callKeepService = CallKeepService.getInstance();
      
      if (callKeepService.isAvailable()) {
        console.log('[CallKeepTestButtons] Using CallKeep native UI for incoming call');
        
        const success = await callKeepService.displayIncomingCall(
          testSessionId,
          testCallerName,
          testCallerName,
          'generic',
          false // voice call
        );
        
        if (success) {
          Alert.alert(
            'Native Incoming Call Triggered',
            'CallKeep native incoming call UI should now be visible. Check your phone\'s call interface.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('CallKeep displayIncomingCall failed');
        }
      } else {
        // Fallback to notification service which will try CallKeep first
        console.log('[CallKeepTestButtons] CallKeep not available, using NotificationService fallback');
        
        const notificationService = NotificationService.getInstance();
        await notificationService.showIncomingCall(
          testSessionId,
          testCallerName,
          'voice',
          testMeetingId,
          testToken
        );
        
        Alert.alert(
          'Incoming Call Test',
          'Test incoming call triggered. If CallKeep is available, you should see native UI.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('[CallKeepTestButtons] Incoming call test failed:', error);
      Alert.alert(
        'Test Failed',
        `Failed to trigger incoming call: ${error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test outgoing call with native CallKeep UI
   */
  const handleTestOutgoingCall = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('[CallKeepTestButtons] Testing outgoing call with native UI...');
      
      // Generate test data
      const testRecipientId = 'test-recipient-' + Date.now();
      const testRecipientName = 'Test Recipient';

      // First try direct CallKeep service for native UI
      const callKeepService = CallKeepService.getInstance();
      
      if (callKeepService.isAvailable()) {
        console.log('[CallKeepTestButtons] Using CallKeep native UI for outgoing call');
        
        const testCallUUID = 'test-outgoing-' + Date.now();
        const success = await callKeepService.startCall(
          testCallUUID,
          testRecipientName,
          testRecipientName,
          'generic',
          false // voice call
        );
        
        if (success) {
          Alert.alert(
            'Native Outgoing Call Triggered',
            'CallKeep native outgoing call UI should now be visible. Check your phone\'s call interface.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('CallKeep startCall failed');
        }
      } else {
        // Fallback to CallController which will try CallKeep first
        console.log('[CallKeepTestButtons] CallKeep not available, using CallController fallback');
        
        const controller = CallController.getInstance();
        const success = await controller.startCall(testRecipientId, testRecipientName, 'voice');
        
        Alert.alert(
          'Outgoing Call Test',
          success 
            ? 'Test outgoing call started. If CallKeep is available, you should see native UI.'
            : 'Test outgoing call failed to start.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('[CallKeepTestButtons] Outgoing call test failed:', error);
      Alert.alert(
        'Test Failed',
        `Failed to trigger outgoing call: ${error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test video call with native CallKeep UI
   */
  const handleTestVideoCall = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('[CallKeepTestButtons] Testing video call with native UI...');
      
      const testRecipientId = 'test-video-recipient-' + Date.now();
      const testRecipientName = 'Test Video Recipient';

      const callKeepService = CallKeepService.getInstance();
      
      if (callKeepService.isAvailable()) {
        const testCallUUID = 'test-video-' + Date.now();
        const success = await callKeepService.startCall(
          testCallUUID,
          testRecipientName,
          testRecipientName,
          'generic',
          true // video call
        );
        
        if (success) {
          Alert.alert(
            'Native Video Call Triggered',
            'CallKeep native video call UI should now be visible.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('CallKeep video startCall failed');
        }
      } else {
        const controller = CallController.getInstance();
        const success = await controller.startCall(testRecipientId, testRecipientName, 'video');
        
        Alert.alert(
          'Video Call Test',
          success 
            ? 'Test video call started. If CallKeep is available, you should see native UI.'
            : 'Test video call failed to start.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('[CallKeepTestButtons] Video call test failed:', error);
      Alert.alert(
        'Test Failed',
        `Failed to trigger video call: ${error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        CallKeep Test
      </Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          styles.incomingButton,
          isLoading && styles.buttonDisabled
        ]}
        onPress={handleTestIncomingCall}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          📞 Incoming
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.outgoingButton,
          isLoading && styles.buttonDisabled
        ]}
        onPress={handleTestOutgoingCall}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          📱 Outgoing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.videoButton,
          isLoading && styles.buttonDisabled
        ]}
        onPress={handleTestVideoCall}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          📹 Video
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
    left: 10,
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 9999,
    minWidth: 100,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    alignItems: 'center',
    minWidth: 80,
  },
  incomingButton: {
    backgroundColor: '#4CAF50', // Green for incoming
  },
  outgoingButton: {
    backgroundColor: '#2196F3', // Blue for outgoing
  },
  videoButton: {
    backgroundColor: '#FF9800', // Orange for video
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CallKeepTestButtons;
