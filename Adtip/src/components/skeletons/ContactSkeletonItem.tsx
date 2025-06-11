import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ContactSkeletonItem: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const baseSkeletonColor = isDarkMode ? colors.gray?.[700] || '#4A5568' : colors.gray?.[200] || '#E2E8F0'; // Fallback colors
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800, // Slightly adjusted duration
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnimation]);

  const animatedStyle = {
    opacity: pulseAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1], // Pulse between 50% and 100% opacity
    }),
  };

  return (
    <View style={[styles.contactItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
      <View style={styles.contactInfo}>
        <Animated.View style={[styles.avatarPlaceholder, { backgroundColor: baseSkeletonColor }, animatedStyle]} />
        <View style={styles.textBlock}>
          <Animated.View style={[styles.textLine, { width: '70%', backgroundColor: baseSkeletonColor }, animatedStyle]} />
          <Animated.View style={[styles.textLine, { width: '50%', marginTop: 8, backgroundColor: baseSkeletonColor }, animatedStyle]} />
        </View>
      </View>
      <View style={styles.callButtons}>
        <Animated.View style={[styles.callButtonPlaceholder, { backgroundColor: baseSkeletonColor }, animatedStyle]} />
        <Animated.View style={[styles.callButtonPlaceholder, { backgroundColor: baseSkeletonColor, marginLeft: 12 }, animatedStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // Adjusted padding
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  textBlock: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  textLine: {
    height: 14, // Adjusted height
    borderRadius: 4,
    marginBottom: 6, // Adjusted margin
  },
  callButtons: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  callButtonPlaceholder: {
    width: 40, // Adjusted size
    height: 40,
    borderRadius: 20,
  },
});

export default ContactSkeletonItem;