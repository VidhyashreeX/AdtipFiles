import React, { useEffect, useRef, useCallback } from 'react';
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
import { Crown, Phone, Video, MessageCircle, Star, CheckCircle, BarChart3, Download } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumAccessModalProps {
  visible: boolean;
  onClose: () => void;
  feature: 'voice_call' | 'video_call' | 'chat' | 'survey' | 'install_to_earn' | 'general';
  onUpgrade?: () => void;
}

const PremiumAccessModal: React.FC<PremiumAccessModalProps> = ({
  visible,
  onClose,
  feature,
  onUpgrade
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Memoized animation functions
  const startEntranceAnimation = useCallback(() => {
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
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const startPulseAnimation = useCallback(() => {
    // Stop any existing pulse animation
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
    }

    pulseAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationRef.current.start();
  }, [pulseAnim]);

  const stopPulseAnimation = useCallback(() => {
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
  }, []);

  const startExitAnimation = useCallback(() => {
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
  }, [fadeAnim, scaleAnim, onClose]);

  useEffect(() => {
    if (visible) {
      // Use setTimeout to avoid scheduling updates during render
      const timer = setTimeout(() => {
        startEntranceAnimation();
        startPulseAnimation();
      }, 0);

      return () => {
        clearTimeout(timer);
        stopPulseAnimation();
      };
    } else {
      stopPulseAnimation();
    }
  }, [visible, startEntranceAnimation, startPulseAnimation, stopPulseAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPulseAnimation();
    };
  }, [stopPulseAnimation]);

  const getFeatureInfo = () => {
    switch (feature) {
      case 'voice_call':
        return {
          icon: Phone,
          title: '📞 Voice Calls - Premium Feature',
          description: 'Voice calling is available for premium users only. Upgrade to enjoy unlimited voice calls with crystal clear quality.',
          benefits: [
            { icon: Phone, title: 'Unlimited Voice Calls', subtitle: 'Call anyone, anytime' },
            { icon: CheckCircle, title: 'HD Audio Quality', subtitle: 'Crystal clear conversations' }
          ]
        };
      case 'video_call':
        return {
          icon: Video,
          title: '📹 Video Calls - Premium Feature',
          description: 'Video calling is available for premium users only. Upgrade to enjoy unlimited video calls with high-definition quality.',
          benefits: [
            { icon: Video, title: 'Unlimited Video Calls', subtitle: 'Face-to-face conversations' },
            { icon: CheckCircle, title: 'HD Video Quality', subtitle: 'High-definition video calls' }
          ]
        };
      case 'chat':
        return {
          icon: MessageCircle,
          title: '💬 Chat - Premium Feature',
          description: 'Chat messaging is available for premium users only. Upgrade to enjoy unlimited messaging with advanced features.',
          benefits: [
            { icon: MessageCircle, title: 'Unlimited Messaging', subtitle: 'Chat with anyone, anytime' },
            { icon: CheckCircle, title: 'Advanced Features', subtitle: 'Rich media & file sharing' }
          ]
        };
      case 'survey':
        return {
          icon: BarChart3,
          title: '📊 Surveys - Premium Feature',
          description: 'Survey participation is available for premium users only. Upgrade to access high-paying surveys and earn up to ₹1000 per survey.',
          benefits: [
            { icon: BarChart3, title: 'High-Paying Surveys', subtitle: 'Earn up to ₹1000 per survey' },
            { icon: CheckCircle, title: '4x Premium Rewards', subtitle: 'Enhanced earning potential' }
          ]
        };
      case 'install_to_earn':
        return {
          icon: Download,
          title: '📱 Install to Earn - Premium Feature',
          description: 'Install to earn tasks are available for premium users only. Upgrade to access high-paying tasks and earn up to ₹2000 per task.',
          benefits: [
            { icon: Download, title: 'High-Paying Tasks', subtitle: 'Earn up to ₹2000 per task' },
            { icon: CheckCircle, title: 'Premium Rewards', subtitle: 'Enhanced earning potential' }
          ]
        };
      default:
        return {
          icon: Crown,
          title: '👑 Premium Feature',
          description: 'This feature is available for premium users only. Upgrade to unlock all premium features.',
          benefits: [
            { icon: Crown, title: 'Premium Access', subtitle: 'Unlock all features' },
            { icon: CheckCircle, title: 'Enhanced Experience', subtitle: 'Better performance & quality' }
          ]
        };
    }
  };

  const featureInfo = getFeatureInfo();
  const FeatureIcon = featureInfo.icon;

  const handleUpgrade = () => {
    console.log(`🚀 [PremiumAccessModal] User clicked upgrade for ${feature}`);
    startExitAnimation();
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('PremiumUser' as never);
    }
  };

  const handleClose = () => {
    startExitAnimation();
  };

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
            {/* Header with animated feature icon */}
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
                  colors={['#FFD700', '#FFB300']}
                  style={styles.iconGradient}
                >
                  <FeatureIcon size={32} color="#000000" />
                </LinearGradient>
              </Animated.View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {featureInfo.title}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              {featureInfo.description}
            </Text>

            {/* Benefits info cards */}
            <View style={styles.infoCards}>
              {featureInfo.benefits.map((benefit, index) => {
                const BenefitIcon = benefit.icon;
                return (
                  <View key={index} style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.card : '#F0FDF4' }]}>
                    <BenefitIcon size={20} color="#10B981" />
                    <View style={styles.infoCardText}>
                      <Text style={[styles.infoCardTitle, { color: colors.text.primary }]}>
                        {benefit.title}
                      </Text>
                      <Text style={[styles.infoCardSubtitle, { color: colors.text.secondary }]}>
                        {benefit.subtitle}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Icon name="x" size={16} color={colors.text.primary} />
                <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFB300']}
                  style={styles.primaryButtonGradient}
                >
                  <Crown size={16} color="#000000" />
                  <Text style={styles.primaryButtonText}>
                    Upgrade Now
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer note */}
            <View style={styles.footer}>
              <Star size={14} color="#FFD700" />
              <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
                💎 Unlock premium features today!
              </Text>
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
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoCards: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoCardText: {
    marginLeft: 12,
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoCardSubtitle: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PremiumAccessModal;
