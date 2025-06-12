import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const EarnCardSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnimation]);

  const pulseStyle = {
    opacity: pulseAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  };

  return (
    <View style={[styles.containerWrapper, { backgroundColor: colors.card }]}>
      <View style={styles.container}>
        {/* Static icon */}
        <View style={[styles.icon, { backgroundColor: colors.skeleton.background }]} />
        
        <View style={styles.textContainer}>
          {/* Animated text lines */}
          <Animated.View style={[styles.title, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[styles.description, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    borderRadius: 12,
    marginBottom: 12,
    height: 80,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    height: 80,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    width: '60%',
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  description: {
    width: '80%',
    height: 12,
    borderRadius: 6,
  },
});

export default EarnCardSkeleton;