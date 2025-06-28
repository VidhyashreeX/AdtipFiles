import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

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
    width: screenWidth - 16, // Match actual carousel item width
    height: 120, // Match actual carousel item height
    borderRadius: 16,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    height: 120,
  },
  icon: {
    width: 60, // Match earnCardIconContainer
    height: 60,
    borderRadius: 30,
    marginRight: 0, // Remove margin since it's positioned differently
  },
  textContainer: {
    flex: 1,
  },
  title: {
    width: '60%',
    height: 20, // Match earnCardTitle font size
    borderRadius: 10,
    marginBottom: 6,
  },
  description: {
    width: '80%',
    height: 14, // Match earnCardDescription font size
    borderRadius: 7,
  },
});

export default EarnCardSkeleton;