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
import { Crown, CheckCircle, IndianRupee, Star } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumPopupProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumPopup: React.FC<PremiumPopupProps> = ({
  visible,
  onClose,
  onUpgrade
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animations
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
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous animations
      startPulseAnimation();
      startRotateAnimation();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const startPulseAnimation = () => {
    Animated.loop(
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
    ).start();
  };

  const startRotateAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const handleUpgrade = () => {
    console.log('🚀 [PremiumPopup] User clicked upgrade button');
    handleClose();
    onUpgrade();
    navigation.navigate('PremiumUser' as never);
  };

  const handleCancel = () => {
    console.log('❌ [PremiumPopup] User clicked cancel button');
    handleClose();
  };

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

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
            {/* Header with animated crown icon */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      { scale: pulseAnim },
                      { rotate: rotateInterpolate },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFB300']}
                  style={styles.iconGradient}
                >
                  <Crown size={32} color="#000000" />
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
              👑 Upgrade to Premium Plan!
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              ⚠️ Your premium plan has expired. Upgrade to premium and earn up to ₹10 per ad!
            </Text>

            {/* Benefits info cards */}
            <View style={styles.infoCards}>
              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.card : '#FFF7ED' }]}>
                <IndianRupee size={20} color="#F59E0B" />
                <View style={styles.infoCardText}>
                  <Text style={[styles.infoCardTitle, { color: colors.text.primary }]}>
                    Earn More
                  </Text>
                  <Text style={[styles.infoCardSubtitle, { color: colors.text.secondary }]}>
                    Up to ₹10 per ad view
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? colors.card : '#F0FDF4' }]}>
                <CheckCircle size={20} color="#10B981" />
                <View style={styles.infoCardText}>
                  <Text style={[styles.infoCardTitle, { color: colors.text.primary }]}>
                    Premium Benefits
                  </Text>
                  <Text style={[styles.infoCardSubtitle, { color: colors.text.secondary }]}>
                    Reduced fees & faster processing
                  </Text>
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleCancel}
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
                💎 Don't miss out on premium earnings!
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
    shadowOpacity: 0.3,
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
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCards: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoCardSubtitle: {
    fontSize: 13,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PremiumPopup;