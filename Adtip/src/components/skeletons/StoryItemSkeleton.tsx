import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const StoryItemSkeleton: React.FC<{ isAddStory?: boolean }> = ({ isAddStory }) => {
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

  if (isAddStory) {
    return (
      <View style={styles.addStoryContainer}>
        {/* Static add story circle */}
        <View style={[styles.addStoryCircle, { backgroundColor: colors.skeleton.background }]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Static avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.skeleton.background }]} />
      
      {/* Animated username */}
      <Animated.View style={[styles.username, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  username: {
    width: 50,
    height: 10,
    borderRadius: 5,
  },
  addStoryContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  addStoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
});

export default StoryItemSkeleton;