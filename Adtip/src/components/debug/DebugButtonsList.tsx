import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, PanResponder, Animated, Dimensions } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import Logger from '../../utils/logger';
import NavigationService from '../../navigation/SimplifiedNavigationService';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [isMinimized, setIsMinimized] = useState(false);

  // Animation values for dragging
  const pan = useRef(new Animated.ValueXY({ x: 10, y: 50 })).current;
  const scale = useRef(new Animated.Value(1)).current;

  // PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only allow dragging from the title bar area
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();

        // Snap to edges if close enough
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;

        let newX = currentX;
        let newY = currentY;

        // Snap to left or right edge
        if (currentX < screenWidth / 2) {
          newX = 10; // Left edge
        } else {
          newX = screenWidth - 220; // Right edge (220 is approximate width)
        }

        // Keep within screen bounds
        newY = Math.max(50, Math.min(screenHeight - 300, currentY));

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: newX, y: newY },
            useNativeDriver: false,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('DebugButtonsList', '❌ Notifee incoming call test failed', {
        error: errorMessage
      });

      Alert.alert(
        'Notifee Test Failed',
        `Failed to display Notifee notification:\n\n${errorMessage}`,
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('DebugButtonsList', '❌ Outgoing call test failed', {
        error: errorMessage
      });

      Alert.alert(
        'Outgoing Call Test Failed',
        `Failed to initiate outgoing call:\n\n${errorMessage}`,
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
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: cardColor,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Title bar with minimize button */}
      <View style={styles.titleBar}>
        <Text style={[styles.title, { color: textColor }]}>
          🧪 Debug Tests
        </Text>
        <TouchableOpacity
          style={styles.minimizeButton}
          onPress={() => setIsMinimized(!isMinimized)}
          activeOpacity={0.7}
        >
          <Text style={[styles.minimizeButtonText, { color: textColor }]}>
            {isMinimized ? '□' : '−'}
          </Text>
        </TouchableOpacity>
      </View>

      {!isMinimized && (
        <>
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
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 200,
    maxWidth: 220,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  minimizeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  minimizeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
