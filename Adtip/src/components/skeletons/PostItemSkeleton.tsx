import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const PostItemSkeleton: React.FC = () => {
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
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Static avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.skeleton.background }]} />
        
        <View style={styles.userInfo}>
          {/* Animated text lines */}
          <Animated.View style={[styles.username, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[styles.timeAgo, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
      </View>

      {/* Animated caption lines */}
      <Animated.View style={[styles.captionLine1, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
      <Animated.View style={[styles.captionLine2, { backgroundColor: colors.skeleton.background }, pulseStyle]} />

      {/* Static media placeholder */}
      <View style={[styles.media, { backgroundColor: colors.skeleton.background }]} />

      {/* Static action buttons */}
      <View style={styles.actionsContainer}>
        <View style={[styles.actionButton, { backgroundColor: colors.skeleton.background }]} />
        <View style={[styles.actionButton, { backgroundColor: colors.skeleton.background }]} />
        <View style={[styles.actionButton, { backgroundColor: colors.skeleton.background }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    width: '50%',
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
  },
  timeAgo: {
    width: '30%',
    height: 10,
    borderRadius: 5,
  },
  captionLine1: {
    height: 12,
    width: '90%',
    borderRadius: 6,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  captionLine2: {
    height: 12,
    width: '70%',
    borderRadius: 6,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  media: {
    width: '100%',
    height: 250,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  actionButton: {
    width: 60,
    height: 20,
    borderRadius: 10,
  },
});

export default PostItemSkeleton;