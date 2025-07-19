import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import { Phone, MessageSquare } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface IncomingCallOverlayProps {
  callerName: string;
  phoneNumber?: string;
  callType: 'voice' | 'video';
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
  onMessage?: () => void;
  forceShow?: boolean; // Force show even if CallKeep is available (for testing)
}

const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
  callerName,
  phoneNumber,
  callType,
  callerAvatar,
  onAccept,
  onDecline,
  onMessage,
  forceShow = false,
}) => {
  const [shouldShow, setShouldShow] = useState(forceShow);

  useEffect(() => {
    const checkCallKeepAvailability = async () => {
      if (forceShow) {
        setShouldShow(true);
        return;
      }

      try {
        // Check if CallKeep is handling the call
        const { CallKeepService } = await import('../../services/calling/CallKeepService');
        const callKeepService = CallKeepService.getInstance();

        if (callKeepService.isAvailable()) {
          console.log('[IncomingCallOverlay] CallKeep is available, hiding custom overlay');
          setShouldShow(false);
        } else {
          console.log('[IncomingCallOverlay] CallKeep not available, showing custom overlay');
          setShouldShow(true);
        }
      } catch (error) {
        console.warn('[IncomingCallOverlay] Error checking CallKeep availability:', error);
        setShouldShow(true); // Show as fallback
      }
    };

    checkCallKeepAvailability();
  }, [forceShow]);

  // Don't render if CallKeep is handling the call
  if (!shouldShow) {
    return null;
  }
  // Animation for the swipe to accept
  const pan = React.useRef(new Animated.ValueXY()).current;
  const acceptButtonOpacity = React.useRef(new Animated.Value(1)).current;
  
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow upward movement
        if (gestureState.dy < 0) {
          Animated.event([null, { dy: pan.y }], { useNativeDriver: false })(_, gestureState);
          
          // Calculate opacity based on movement (fade out as user swipes up)
          const opacity = Math.max(0, 1 - Math.abs(gestureState.dy) / 200);
          acceptButtonOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped up enough, accept the call
        if (gestureState.dy < -100) {
          onAccept();
        } else {
          // Reset position if not swiped enough
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          
          // Reset opacity
          Animated.spring(acceptButtonOpacity, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
        }
      }
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Dark patterned background */}
      <View style={styles.backgroundPattern}>
        <Image 
          source={require('../../assets/images/whatsapp_bg_pattern.png')} 
          style={styles.patternImage}
          resizeMode="repeat" 
        />
      </View>
      
      {/* Caller info */}
      <View style={styles.callerInfoContainer}>
        <Text style={styles.callerName}>{callerName}</Text>
        {phoneNumber && (
          <View style={styles.phoneNumberContainer}>
            <Image 
              source={require('../../assets/images/whatsapp_icon.png')} 
              style={styles.whatsappIcon} 
            />
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </View>
        )}
      </View>
      
      {/* Caller avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          {callerAvatar ? (
            <Image source={{ uri: callerAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {callerName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      </View>
      
      {/* Call actions */}
      <View style={styles.actionsContainer}>
        {/* Decline button */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]} 
          onPress={onDecline}
        >
          <Phone style={styles.declineIcon} size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Accept button with pan responder */}
        <Animated.View 
          style={[
            styles.actionButton, 
            styles.acceptButton,
            { transform: pan.getTranslateTransform(), opacity: acceptButtonOpacity }
          ]}
          {...panResponder.panHandlers}
        >
          <Phone size={24} color="#fff" />
        </Animated.View>
        
        {/* Message button */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]} 
          onPress={onMessage}
        >
          <MessageSquare size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Action labels */}
      <View style={styles.actionLabels}>
        <Text style={styles.actionLabel}>Decline</Text>
        <Text style={styles.actionLabel}>Swipe up to accept</Text>
        <Text style={styles.actionLabel}>Message</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  callerInfoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '500',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  whatsappIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  phoneNumber: {
    color: '#CCCCCC',
    fontSize: 18,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1F2C34',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#5ACFAA',
    fontSize: 90,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#FF4343',
    transform: [{ rotate: '135deg' }],
  },
  declineIcon: {
    transform: [{ rotate: '225deg' }],
  },
  acceptButton: {
    backgroundColor: '#00A884',
  },
  messageButton: {
    backgroundColor: '#3B3B3B',
  },
  actionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  actionLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    width: 70,
  },
});

export default IncomingCallOverlay;
