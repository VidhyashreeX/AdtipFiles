// src/components/common/PremiumUpgradeAlert.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Crown, Gamepad2, X, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface PremiumUpgradeAlertProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  description?: string;
}

const PremiumUpgradeAlert: React.FC<PremiumUpgradeAlertProps> = ({
  visible,
  onClose,
  onUpgrade,
  title = "🎮 Premium Games Unlocked!",
  description = "Upgrade to Premium to access exciting games and earn more rewards!"
}) => {
  const { colors, isDarkMode } = useTheme();
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.3);
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(50);
  const crownRotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const shimmerX = useSharedValue(-screenWidth);

  // Start animations when visible
  useEffect(() => {
    if (visible) {
      // Backdrop fade in - instant
      backdropOpacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.quad),
      });

      // Modal entrance with spring - instant, no delay
      modalScale.value = withSpring(1, {
        damping: 20,
        stiffness: 200,
        mass: 0.6,
      });

      modalOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });

      modalTranslateY.value = withSpring(0, {
        damping: 25,
        stiffness: 150,
      });

      // Crown rotation animation - reduced delay
      crownRotation.value = withDelay(
        150,
        withSequence(
          withTiming(10, { duration: 150 }),
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 150 })
        )
      );

      // Sparkle animation - reduced delay
      sparkleScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.2, { damping: 10, stiffness: 200 }),
          withSpring(1, { damping: 15, stiffness: 150 })
        )
      );

      // Shimmer effect - reduced delay
      shimmerX.value = withDelay(
        300,
        withTiming(screenWidth, {
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
        })
      );
    } else {
      // Reset animations
      backdropOpacity.value = 0;
      modalScale.value = 0.3;
      modalOpacity.value = 0;
      modalTranslateY.value = 50;
      crownRotation.value = 0;
      sparkleScale.value = 0;
      shimmerX.value = -screenWidth;
    }
  }, [visible]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value },
    ],
    opacity: modalOpacity.value,
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotation.value}deg` }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  // Handle button press animations
  const handleUpgradePress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    setTimeout(() => {
      onUpgrade();
      handleClose();
    }, 200);
  };

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.3, { duration: 200 });
    modalOpacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const styles = createStyles(colors, isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[styles.modal, modalStyle]}>
          {/* Shimmer Effect */}
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Crown Icon */}
          <Animated.View style={[styles.crownContainer, crownStyle]}>
            <Crown size={48} color="#FFD700" fill="#FFD700" />
          </Animated.View>

          {/* Sparkles */}
          <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
            <Sparkles size={24} color="#FFD700" />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            {description}
          </Text>

          {/* Game Icon */}
          <View style={styles.gameIconContainer}>
            <Gamepad2 size={32} color="#4CAF50" />
          </View>

          {/* Upgrade Button */}
          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgradePress}
              activeOpacity={0.9}
            >
              <Text style={styles.upgradeButtonText}>
                👑 Upgrade to Premium
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Later Button */}
          <TouchableOpacity style={styles.laterButton} onPress={handleClose}>
            <Text style={[styles.laterButtonText, { color: colors.text.tertiary }]}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouch: {
    flex: 1,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    maxWidth: screenWidth * 0.9,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  crownContainer: {
    marginBottom: 16,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 40,
    right: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  gameIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 50,
    padding: 16,
    marginBottom: 24,
  },
  upgradeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    minWidth: 200,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  laterButton: {
    paddingVertical: 12,
  },
  laterButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PremiumUpgradeAlert;
