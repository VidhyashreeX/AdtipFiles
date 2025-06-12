import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const RelatedVideoCardSkeleton: React.FC = () => {
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
    <View style={[styles.relatedVideoCard, { backgroundColor: colors.card }]}>
      <View style={styles.itemContainer}>
        {/* Static thumbnail */}
        <View style={[styles.thumbnail, { backgroundColor: colors.skeleton.background }]} />
        
        <View style={styles.textContainer}>
          {/* Animated text lines */}
          <Animated.View style={[{ width: '90%', height: 16, borderRadius: 8, marginBottom: 8, backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[{ width: '60%', height: 12, borderRadius: 6, marginBottom: 6, backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[{ width: '70%', height: 10, borderRadius: 5, backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  relatedVideoCard: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  thumbnail: {
    width: 120,
    height: 67,
  },
  textContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
});

export default React.memo(RelatedVideoCardSkeleton);