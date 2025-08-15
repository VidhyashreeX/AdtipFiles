import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import CallController from '../../services/calling/CallController';
import NotificationService from '../../services/calling/NotificationService';
import { CallKeepService } from '../../services/calling/CallKeepService';
import { Logger } from '../../utils/ProductionLogger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * CallKeep Test Buttons Component
 *
 * Provides test buttons for triggering incoming and outgoing native CallKeep UI
 * Only visible in debug builds (__DEV__ === true)
 * Draggable and closable for better UX
 */
const CallKeepTestButtons: React.FC = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Animation values for dragging
  const pan = useRef(new Animated.ValueXY({
    x: 10,
    y: Platform.OS === 'ios' ? 60 : 40
  })).current;
  const scale = useRef(new Animated.Value(1)).current;

  // PanResponder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
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
          newX = screenWidth - 120; // Right edge (120 is approximate width)
        }

        // Keep within screen bounds
        newY = Math.max(50, Math.min(screenHeight - 200, currentY));

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

  // Only show in debug builds or if not visible
  if (!__DEV__ || !isVisible) {
    return null;
  }

  // Log component initialization and CallKeep status
  useEffect(() => {
    Logger.info('CallKeepTestButtons', '🔧 CallKeep test buttons initialized', {
      isDev: __DEV__,
      platform: Platform.OS
    });

    // Check CallKeep availability on mount
    const checkCallKeepStatus = async () => {
      try {
        const callKeepService = CallKeepService.getInstance();
        const isAvailable = callKeepService.isAvailable();
        const status = callKeepService.getCallKeepStatus();

        Logger.info('CallKeepTestButtons', '📊 CallKeep status check', {
          isAvailable,
          status,
          platform: Platform.OS
        });
      } catch (error) {
        Logger.warn('CallKeepTestButtons', '⚠️ CallKeep status check failed', {
          error: error.message || error
        });
      }
    };

    checkCallKeepStatus();
  }, []);

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
          Logger.info('CallKeepTestButtons', '✅ Native incoming call UI triggered successfully', {
            sessionId: testSessionId,
            callerName: testCallerName,
            callType: 'voice'
          });

          Alert.alert(
            'Native Incoming Call Triggered',
            'CallKeep native incoming call UI should now be visible. Check your phone\'s call interface.',
            [{ text: 'OK' }]
          );
        } else {
          Logger.error('CallKeepTestButtons', '❌ CallKeep displayIncomingCall failed', {
            sessionId: testSessionId,
            callerName: testCallerName
          });
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

        Logger.info('CallKeepTestButtons', '📞 Incoming call fallback triggered via NotificationService', {
          sessionId: testSessionId,
          callerName: testCallerName,
          callType: 'voice'
        });

        Alert.alert(
          'Incoming Call Test',
          'Test incoming call triggered. If CallKeep is available, you should see native UI.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('[CallKeepTestButtons] Incoming call test failed:', error);

      Logger.error('CallKeepTestButtons', '❌ Incoming call test failed', {
        error: error.message || error,
        sessionId: testSessionId,
        callerName: testCallerName,
        stack: error.stack
      });

      Alert.alert(
        'Incoming Call Test Failed',
        `Failed to trigger incoming call:\n\n${error.message || error}\n\nCheck console for details.`,
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
          Logger.info('CallKeepTestButtons', '✅ Native outgoing call UI triggered successfully', {
            callUUID: testCallUUID,
            recipientName: testRecipientName,
            callType: 'voice',
            method: 'CallKeepService.startCall'
          });

          Alert.alert(
            'Native Outgoing Call Triggered',
            'CallKeep native outgoing call UI should now be visible. Check your phone\'s call interface.',
            [{ text: 'OK' }]
          );
        } else {
          Logger.error('CallKeepTestButtons', '❌ CallKeep startCall failed', {
            callUUID: testCallUUID,
            recipientName: testRecipientName
          });
          throw new Error('CallKeep startCall failed');
        }
      } else {
        // Fallback to CallController which will try CallKeep first
        console.log('[CallKeepTestButtons] CallKeep not available, using CallController fallback');
        
        const controller = CallController.getInstance();
        const success = await controller.startCall(testRecipientId, testRecipientName, 'voice');

        if (success) {
          Logger.info('CallKeepTestButtons', '✅ Outgoing call fallback triggered via CallController', {
            recipientId: testRecipientId,
            recipientName: testRecipientName,
            callType: 'voice',
            method: 'CallController.startCall'
          });
        } else {
          Logger.error('CallKeepTestButtons', '❌ CallController startCall failed', {
            recipientId: testRecipientId,
            recipientName: testRecipientName
          });
        }

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

      Logger.error('CallKeepTestButtons', '❌ Outgoing call test failed', {
        error: error.message || error,
        recipientId: testRecipientId,
        recipientName: testRecipientName,
        stack: error.stack
      });

      Alert.alert(
        'Outgoing Call Test Failed',
        `Failed to trigger outgoing call:\n\n${error.message || error}\n\nCheck console for details.`,
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
          Logger.info('CallKeepTestButtons', '✅ Native video call UI triggered successfully', {
            callUUID: testCallUUID,
            recipientName: testRecipientName,
            callType: 'video',
            method: 'CallKeepService.startCall'
          });

          Alert.alert(
            'Native Video Call Triggered',
            'CallKeep native video call UI should now be visible.',
            [{ text: 'OK' }]
          );
        } else {
          Logger.error('CallKeepTestButtons', '❌ CallKeep video startCall failed', {
            callUUID: testCallUUID,
            recipientName: testRecipientName
          });
          throw new Error('CallKeep video startCall failed');
        }
      } else {
        const controller = CallController.getInstance();
        const success = await controller.startCall(testRecipientId, testRecipientName, 'video');

        if (success) {
          Logger.info('CallKeepTestButtons', '✅ Video call fallback triggered via CallController', {
            recipientId: testRecipientId,
            recipientName: testRecipientName,
            callType: 'video',
            method: 'CallController.startCall'
          });
        } else {
          Logger.error('CallKeepTestButtons', '❌ CallController video startCall failed', {
            recipientId: testRecipientId,
            recipientName: testRecipientName
          });
        }

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

      Logger.error('CallKeepTestButtons', '❌ Video call test failed', {
        error: error.message || error,
        recipientId: testRecipientId,
        recipientName: testRecipientName,
        stack: error.stack
      });

      Alert.alert(
        'Video Call Test Failed',
        `Failed to trigger video call:\n\n${error.message || error}\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Title bar with close button */}
      <View style={styles.titleBar}>
        <Text style={[styles.title, { color: colors.text }]}>
          📞 CallKeep Test
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsVisible(false)}
          activeOpacity={0.7}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>
            ×
          </Text>
        </TouchableOpacity>
      </View>

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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 9999,
    minWidth: 120,
    borderWidth: 1,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
