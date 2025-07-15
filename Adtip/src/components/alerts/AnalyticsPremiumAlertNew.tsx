import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Crown, BarChart3, TrendingUp, Users, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsPremiumAlertProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onGoBack: () => void;
}

const AnalyticsPremiumAlert: React.FC<AnalyticsPremiumAlertProps> = ({
  visible,
  onClose,
  onUpgrade,
  onGoBack,
}) => {
  const { colors, isDarkMode } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing animation for crown
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
      pulse.start();

      return () => {
        pulse.stop();
      };
    } else {
      // Reset animations when not visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim, pulseAnim]);

  if (!visible) return null;

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      width: SCREEN_WIDTH * 0.85,
      maxWidth: 400,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 15,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
    },
    headerGradient: {
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    crownContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginTop: 4,
    },
    contentContainer: {
      padding: 16,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    featureText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
    secureText: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    upgradeButton: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    upgradeButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    sparkleContainer: {
      position: 'absolute',
      top: -6,
      right: -6,
    },
  });

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
      <LinearGradient
        colors={['#7B4DFF', '#5E72EB', '#FF9190']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.crownContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Crown size={32} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.headerTitle}>Premium Analytics</Text>
        <Text style={styles.headerSubtitle}>Unlock powerful insights for your content</Text>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.featureRow}>
          <LinearGradient
            colors={['#7B4DFF', '#5E72EB']}
            style={styles.featureIcon}
          >
            <BarChart3 size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.featureText, { color: colors.text.primary }]}>
            Detailed Analytics Dashboard
          </Text>
        </View>

        <View style={styles.featureRow}>
          <LinearGradient
            colors={['#5E72EB', '#FF9190']}
            style={styles.featureIcon}
          >
            <TrendingUp size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.featureText, { color: colors.text.primary }]}>
            Revenue Tracking & Insights
          </Text>
        </View>

        <View style={styles.featureRow}>
          <LinearGradient
            colors={['#FF9190', '#7B4DFF']}
            style={styles.featureIcon}
          >
            <Users size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.featureText, { color: colors.text.primary }]}>
            Audience Demographics
          </Text>
        </View>

        <Text style={[styles.secureText, { color: colors.text.secondary }]}>
          Secure payment • Cancel anytime • Instant access
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={() => {
              onClose();
              onGoBack();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: colors.text.secondary }]}>
              Go Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onClose();
              onUpgrade();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7B4DFF', '#5E72EB', '#FF9190']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeButton}
            >
              <Crown size={18} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              <View style={styles.sparkleContainer}>
                <Sparkles size={16} color="#FFD700" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
    </View>
  );
};

export default AnalyticsPremiumAlert;
