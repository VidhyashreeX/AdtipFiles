import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Phone, Video, Clock, IndianRupee, User } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CallConfirmationAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  callType: 'voice' | 'video';
  recipientName: string;
  rateText: string;
  maxMinutes: number;
  currentBalance: string;
  isPremium: boolean;
}

const CallConfirmationAlert: React.FC<CallConfirmationAlertProps> = ({
  visible,
  onClose,
  onConfirm,
  callType,
  recipientName,
  rateText,
  maxMinutes,
  currentBalance,
  isPremium,
}) => {
  const { colors, isDarkMode } = useTheme();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
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
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for call icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleConfirm = () => {
    handleClose();
    setTimeout(() => onConfirm(), 100);
  };

  const CallIcon = callType === 'video' ? Video : Phone;
  const callTypeColor = callType === 'video' ? '#3B82F6' : '#10B981';
  const callTypeGradient = callType === 'video' ? ['#3B82F6', '#1D4ED8'] : ['#10B981', '#059669'];

  const styles = createStyles(colors, isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={isDarkMode ? ['#1F2937', '#374151'] : ['#FFFFFF', '#F9FAFB']}
            style={styles.alertCard}
          >
            {/* Header with animated call icon */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={callTypeGradient}
                  style={styles.iconGradient}
                >
                  <CallIcon size={32} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {callType === 'video' ? '📹' : '📞'} {callType === 'video' ? 'Video' : 'Voice'} Call
            </Text>

            {/* Recipient */}
            <View style={styles.recipientContainer}>
              <User size={16} color={colors.text.secondary} />
              <Text style={[styles.recipientText, { color: colors.text.secondary }]}>
                Calling {recipientName}
              </Text>
            </View>

            {/* Billing info cards */}
            <View style={styles.infoCards}>
              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.card : '#F0FDF4' }]}>
                <IndianRupee size={18} color="#10B981" />
                <View style={styles.infoCardText}>
                  <Text style={[styles.infoCardTitle, { color: colors.text.primary }]}>
                    Rate{isPremium ? ' (Premium)' : ''}
                  </Text>
                  <Text style={[styles.infoCardSubtitle, { color: colors.text.secondary }]}>
                    {rateText}/min
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.card : '#EFF6FF' }]}>
                <Clock size={18} color="#3B82F6" />
                <View style={styles.infoCardText}>
                  <Text style={[styles.infoCardTitle, { color: colors.text.primary }]}>
                    Max Duration
                  </Text>
                  <Text style={[styles.infoCardSubtitle, { color: colors.text.secondary }]}>
                    {maxMinutes} minutes
                  </Text>
                </View>
              </View>
            </View>

            {/* Balance info */}
            <View style={[styles.balanceContainer, { backgroundColor: isDarkMode ? colors.card : '#FEF3C7' }]}>
              <Icon name="credit-card" size={16} color="#F59E0B" />
              <Text style={[styles.balanceText, { color: colors.text.primary }]}>
                Current Balance: {currentBalance}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={callTypeGradient}
                  style={styles.primaryButtonGradient}
                >
                  <CallIcon size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Call Now
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
  },
  alertCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    alignSelf: 'center',
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  recipientText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoCardText: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoCardSubtitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CallConfirmationAlert;
