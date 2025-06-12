import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const BalanceCardSkeleton: React.FC = () => {
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
    <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
      <View style={styles.item}>
        {/* Animated text elements */}
        <Animated.View style={[{ width: 120, height: 20, borderRadius: 10, marginBottom: 10, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        <Animated.View style={[{ width: 180, height: 36, borderRadius: 18, marginBottom: 20, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        
        {/* Static button containers */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[{ width: '48%', height: 44, borderRadius: 10, backgroundColor: colors.skeleton.background }]} />
          <View style={[{ width: '48%', height: 44, borderRadius: 10, backgroundColor: colors.skeleton.background }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  item: {
    // Structure container
  },
});

export default BalanceCardSkeleton;