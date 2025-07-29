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
import { Crown, Phone, Video, Star, Zap } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumCallRateAlertProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onContinue: () => void;
  callType?: 'voice' | 'video';
}

const PremiumCallRateAlert: React.FC<PremiumCallRateAlertProps> = ({
  visible,
  onClose,
  onUpgrade,
  onContinue,
  callType = 'voice'
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
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for crown icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
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
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Use setTimeout to avoid scheduling updates during React's commit phase
      setTimeout(() => {
        onClose();
      }, 0);
    });
  };

  const handleUpgrade = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Use setTimeout to avoid scheduling updates during React's commit phase
      setTimeout(() => {
        onUpgrade();
      }, 0);
    });
  };

  const handleContinue = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Use setTimeout to avoid scheduling updates during React's commit phase
      setTimeout(() => {
        onContinue();
      }, 0);
    });
  };

  const CallIcon = callType === 'video' ? Video : Phone;
  const callTypeText = callType === 'video' ? 'Video' : 'Voice';

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
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFB300']}
                  style={styles.iconGradient}
                >
                  <Crown size={28} color="#000000" />
                </LinearGradient>
              </Animated.View>
              
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              🚀 Premium {callTypeText} Call
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              Get premium rates and enhanced call quality with our premium plan!
            </Text>

            {/* Rate comparison */}
            <View style={styles.rateComparison}>
              <View style={[styles.rateCard, styles.standardRate, { backgroundColor: isDarkMode ? colors.card : '#FEF2F2' }]}>
                <Text style={[styles.rateLabel, { color: colors.text.secondary }]}>Standard Rate</Text>
                <Text style={[styles.rateValue, { color: '#EF4444' }]}>₹7/min</Text>
              </View>
              
              <View style={styles.vsContainer}>
                <Text style={[styles.vsText, { color: colors.text.tertiary }]}>VS</Text>
              </View>
              
              <View style={[styles.rateCard, styles.premiumRate]}>
                <LinearGradient
                  colors={['#FFD700', '#FFB300']}
                  style={styles.premiumRateGradient}
                >
                  <Text style={styles.premiumRateLabel}>Premium Rate</Text>
                  <Text style={styles.premiumRateValue}>₹5/min</Text>
                  <View style={styles.savingsTag}>
                    <Star size={12} color="#000" />
                    <Text style={styles.savingsText}>Save 30%</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Premium benefits */}
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Zap size={16} color="#10B981" />
                <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                  Better call quality
                </Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Icon name="clock" size={16} color="#10B981" />
                <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                  Longer call duration
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.continueButton, { borderColor: colors.border }]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={[styles.continueButtonText, { color: colors.text.secondary }]}>
                  Continue with ₹7/min
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFB300']}
                  style={styles.upgradeButtonGradient}
                >
                  <Crown size={16} color="#000000" />
                  <Text style={styles.upgradeButtonText}>
                    Upgrade to Premium
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
    maxWidth: 380,
  },
  alertCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    alignSelf: 'center',
    flex: 1,
    alignItems: 'center',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  rateComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  rateCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  standardRate: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  premiumRate: {
    overflow: 'hidden',
  },
  premiumRateGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  premiumRateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  premiumRateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  savingsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  vsContainer: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  benefitsList: {
    marginBottom: 20,
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  continueButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  upgradeButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PremiumCallRateAlert;
