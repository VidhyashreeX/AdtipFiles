import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const PlanCardSkeleton: React.FC = () => {
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
    <View style={[styles.planContainer, { backgroundColor: colors.card }]}>
      <View style={styles.item}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {/* Static icon */}
          <View style={[{ width: 24, height: 24, borderRadius: 12, marginRight: 10, backgroundColor: colors.skeleton.background }]} />
          {/* Animated title */}
          <Animated.View style={[{ width: 150, height: 20, borderRadius: 10, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
        
        {/* Animated description lines */}
        <Animated.View style={[{ width: '80%', height: 16, borderRadius: 8, marginBottom: 12, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        <Animated.View style={[{ width: '60%', height: 16, borderRadius: 8, marginBottom: 16, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        
        {/* Static button */}
        <View style={[{ width: '100%', height: 40, borderRadius: 10, backgroundColor: colors.skeleton.background }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  planContainer: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  item: {
    // Structure container
  },
});

export default PlanCardSkeleton;