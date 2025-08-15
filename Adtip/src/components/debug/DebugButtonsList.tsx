import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import Logger from '../../utils/logger';
import NavigationService from '../../navigation/SimplifiedNavigationService';
import { useTheme } from '../../contexts/ThemeContext';

// Fallback theme colors when navigation theme is not available
const fallbackTheme = {
  colors: {
    card: '#1C1C1E',
    text: '#FFFFFF',
    background: '#000000',
    primary: '#007AFF',
    border: '#333333',
  }
};

/**
 * Debug Buttons List Component
 * 
 * Comprehensive debug buttons for testing various call functionalities
 * Only visible in debug builds (__DEV__ === true)
 */
const DebugButtonsList: React.FC = () => {
  // Use fallback theme if navigation theme is not available
  let colors;
  try {
    const theme = useTheme();
    colors = theme.colors;
  } catch (error) {
    console.warn('[DebugButtonsList] Navigation theme not available, using fallback theme');
    colors = fallbackTheme.colors;
  }
  
  const [isLoading, setIsLoading] = useState(false);

  // Only show in debug builds
  if (!__DEV__) {
    return null;
  }

  /**
   * Test Notifee Custom Incoming Call UI
   * This should work perfectly in all states (killed/bg/fg)
   */
  const testNotifeeIncomingCall = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log('[DebugButtonsList] Testing Notifee custom incoming call UI...');

      // Generate test data
      const testSessionId = 'notifee-test-' + Date.now();
      const testCallerName = 'Notifee Test Caller';
      const testMeetingId = 'meeting-' + Date.now();
      const testToken = 'token-' + Date.now();
      const testCallType = 'video';

      // Use NotifeeCallHandler for proper integration
      const { default: NotifeeCallHandler } = await import('../../services/notification/NotifeeCallHandler');
      const notifeeHandler = NotifeeCallHandler.getInstance();

      // Ensure handler is initialized
      await notifeeHandler.initialize();

      // Display incoming call notification
      const success = await notifeeHandler.displayIncomingCall({
        sessionId: testSessionId,
        callerName: testCallerName,
        callType: testCallType,
        meetingId: testMeetingId,
        token: testToken
      });

      if (success) {
        Logger.info('DebugButtonsList', '✅ Notifee incoming call notification displayed', {
          sessionId: testSessionId,
          callerName: testCallerName,
          callType: testCallType
        });

        Alert.alert(
          'Notifee Incoming Call Test',
          'Custom incoming call notification displayed!\n\n' +
          '• Should work in all app states (killed/bg/fg)\n' +
          '• Tap "Answer" to navigate to meeting screen\n' +
          '• Tap "Decline" to dismiss\n' +
          '• Full-screen intent should show on lock screen\n' +
          '• Navigation handled automatically',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('NotifeeCallHandler failed to display notification');
      }

    } catch (error) {
      console.error('[DebugButtonsList] Notifee test failed:', error);
      Logger.error('DebugButtonsList', '❌ Notifee incoming call test failed', {
        error: error.message || error
      });

      Alert.alert(
        'Notifee Test Failed',
        `Failed to display Notifee notification:\n\n${error.message || error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test outgoing call with ringing state
   */
  const testOutgoingCallRinging = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('[DebugButtonsList] Testing outgoing call with ringing...');
      
      // Generate test data
      const testMeetingId = 'ringing-test-' + Date.now();
      const testToken = 'token-' + Date.now();
      const testRecipientName = 'Test Recipient';
      
      // Navigate to meeting screen with outgoing call parameters
      const success = NavigationService.navigateToMeeting({
        meetingId: testMeetingId,
        token: testToken,
        displayName: 'Test Caller',
        callType: 'video',
        isInitiator: true,
        recipientName: testRecipientName,
        callData: {
          direction: 'outgoing',
          sessionId: 'session-' + Date.now(),
          type: 'video'
        }
      });

      if (success) {
        Logger.info('DebugButtonsList', '✅ Outgoing call test initiated', {
          meetingId: testMeetingId,
          recipientName: testRecipientName
        });

        Alert.alert(
          'Outgoing Call Test',
          'Outgoing call initiated!\n\n' +
          '• Should show "Ringing..." until participant joins\n' +
          '• VideoSDK will detect when 2nd participant joins\n' +
          '• Ringing should stop automatically',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Navigation to meeting screen failed');
      }

    } catch (error) {
      console.error('[DebugButtonsList] Outgoing call test failed:', error);
      Logger.error('DebugButtonsList', '❌ Outgoing call test failed', {
        error: error.message || error
      });

      Alert.alert(
        'Outgoing Call Test Failed',
        `Failed to initiate outgoing call:\n\n${error.message || error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open Android notification settings
   */
  const openNotificationSettings = async () => {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('[DebugButtonsList] Failed to open notification settings:', error);
      Alert.alert('Error', 'Failed to open notification settings');
    }
  };

  /**
   * Test deep link navigation for call
   */
  const testDeepLink = async () => {
    try {
      // Create a proper call deep link with all required parameters
      const testSessionId = 'test-session-' + Date.now();
      const testMeetingId = 'test-meeting-' + Date.now();
      const testToken = 'test-token-' + Date.now();
      const testCallerName = 'Deep Link Test Caller';

      const testUrl = `adtip://meeting?meetingId=${testMeetingId}&token=${testToken}&callerName=${testCallerName}&callType=video&sessionId=${testSessionId}`;

      console.log('[DebugButtonsList] Testing deep link:', testUrl);

      const canOpen = await Linking.canOpenURL(testUrl);

      if (canOpen) {
        await Linking.openURL(testUrl);
        Alert.alert(
          'Deep Link Test',
          'Deep link opened successfully!\n\n' +
          'Should navigate to Meeting screen with:\n' +
          `• Meeting ID: ${testMeetingId}\n` +
          `• Caller: ${testCallerName}\n` +
          '• Call Type: Video'
        );
      } else {
        Alert.alert('Deep Link Test', 'Cannot open deep link URL');
      }
    } catch (error) {
      console.error('[DebugButtonsList] Deep link test failed:', error);
      Alert.alert('Deep Link Test Failed', error instanceof Error ? error.message : String(error));
    }
  };

  const textColor = typeof colors.text === 'string' ? colors.text : colors.text?.primary || '#ffffff';
  const cardColor = colors.card || '#1a1a1a';

  return (
    <View style={[styles.container, { backgroundColor: cardColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        🧪 Debug Tests
      </Text>
      
      <TouchableOpacity
        style={[styles.button, styles.notifeeButton, isLoading && styles.buttonDisabled]}
        onPress={testNotifeeIncomingCall}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          📱 Test Notifee Incoming Call
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.ringingButton, isLoading && styles.buttonDisabled]}
        onPress={testOutgoingCallRinging}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          📞 Test Outgoing Call Ringing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.settingsButton]}
        onPress={openNotificationSettings}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          ⚙️ Notification Settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.deepLinkButton]}
        onPress={testDeepLink}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          🔗 Test Deep Link
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 200,
    zIndex: 1000,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  notifeeButton: {
    backgroundColor: '#32D74B',
  },
  ringingButton: {
    backgroundColor: '#FF9500',
  },
  settingsButton: {
    backgroundColor: '#5856D6',
  },
  deepLinkButton: {
    backgroundColor: '#007AFF',
  },
});

export default DebugButtonsList;
