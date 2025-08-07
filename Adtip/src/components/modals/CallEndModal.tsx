import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Phone, PhoneOff, DollarSign, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CallEndModalProps {
  visible: boolean;
  onClose: () => void;
  callType: 'voice' | 'video';
  isCallInitiator: boolean; // true if user initiated the call (money deducted), false if received (money credited)
  amount: number;
  duration: string; // formatted duration like "2:34"
  callerName?: string;
  receiverName?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CallEndModal: React.FC<CallEndModalProps> = ({
  visible,
  onClose,
  callType,
  isCallInitiator,
  amount,
  duration,
  callerName,
  receiverName,
}) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for amount
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => {
        clearTimeout(timer);
        pulseAnimation.stop();
      };
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim, pulseAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getModalContent = () => {
    if (isCallInitiator) {
      return {
        title: 'Money Deducted',
        subtitle: `₹${amount.toFixed(2)} charged for ${callType} call`,
        icon: TrendingDown,
        iconColor: '#FF6B6B',
        gradientColors: isDarkMode 
          ? ['#2D1B1B', '#3D2626', '#4D3131'] 
          : ['#FFE5E5', '#FFCCCC', '#FFB3B3'],
        textColor: '#FF6B6B',
      };
    } else {
      return {
        title: 'Money Credited',
        subtitle: `₹${amount.toFixed(2)} earned from ${callType} call`,
        icon: TrendingUp,
        iconColor: '#4ECDC4',
        gradientColors: isDarkMode 
          ? ['#1B2D2A', '#263D37', '#314D44'] 
          : ['#E5F9F6', '#CCFFF2', '#B3FFED'],
        textColor: '#4ECDC4',
      };
    }
  };

  const modalContent = getModalContent();
  const IconComponent = modalContent.icon;

  const styles = createStyles(colors, isDarkMode, modalContent);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Gradient Background */}
          <LinearGradient
            colors={modalContent.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            {/* Content */}
            <View style={styles.content}>
              {/* Icon */}
              <Animated.View 
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <View style={[styles.iconBackground, { backgroundColor: modalContent.iconColor }]}>
                  <IconComponent size={32} color="#FFFFFF" />
                </View>
              </Animated.View>

              {/* Title */}
              <Text style={[styles.title, { color: modalContent.textColor }]}>
                {modalContent.title}
              </Text>

              {/* Amount */}
              <Text style={[styles.amount, { color: colors.text.primary }]}>
                ₹{amount.toFixed(2)}
              </Text>

              {/* Subtitle */}
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                {modalContent.subtitle}
              </Text>

              {/* Call Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Phone size={16} color={colors.text.secondary} />
                  <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                    Duration: {duration}
                  </Text>
                </View>
                
                {(callerName || receiverName) && (
                  <View style={styles.detailRow}>
                    <DollarSign size={16} color={colors.text.secondary} />
                    <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                      {isCallInitiator 
                        ? `Call to ${receiverName || 'Unknown'}` 
                        : `Call from ${callerName || 'Unknown'}`
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: modalContent.iconColor }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean, modalContent: any) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  gradientBackground: {
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CallEndModal;
