import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const TransactionRowSkeleton: React.FC = () => {
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
    <View style={[styles.transactionRow, { borderBottomColor: colors.borderLight }]}>
      <View style={styles.item}>
        <View style={{ flex: 1, marginRight: 16 }}>
          {/* Animated text lines */}
          <Animated.View style={[{ width: '80%', height: 18, borderRadius: 9, marginBottom: 8, backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[{ width: '60%', height: 14, borderRadius: 7, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {/* Animated amount and date */}
          <Animated.View style={[{ width: 80, height: 18, borderRadius: 9, marginBottom: 4, backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[{ width: 60, height: 12, borderRadius: 6, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TransactionRowSkeleton;