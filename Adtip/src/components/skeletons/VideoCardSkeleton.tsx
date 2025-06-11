import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext'; 

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_GAP = 16;
const NUM_COLUMNS = 2;
const cardWidth = (screenWidth - CARD_MARGIN_HORIZONTAL * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const VideoCardSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  // This base color is for the animated parts of the skeleton
  const baseSkeletonColor = isDarkMode ? colors.gray[700] : colors.gray[200];
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnimation]);

  const animatedStyle = {
    opacity: pulseAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1], 
    }),
  };

  return (
    <View style={[styles.videoCard, { backgroundColor: colors.card, shadowColor: colors.black }]}>
      <Animated.View style={[styles.thumbnailPlaceholder, { backgroundColor: baseSkeletonColor }, animatedStyle]} />
      <View style={styles.contentPlaceholder}>
        <View style={styles.avatarRow}>
          <Animated.View style={[styles.avatarPlaceholder, { backgroundColor: baseSkeletonColor }, animatedStyle]} />
          <View style={styles.textLinesPlaceholder}>
            <Animated.View style={[styles.textLine, { width: '70%', backgroundColor: baseSkeletonColor }, animatedStyle]} />
            <Animated.View style={[styles.textLine, { width: '50%', backgroundColor: baseSkeletonColor, marginTop: 4 }, animatedStyle]} />
          </View>
        </View>
        <Animated.View style={[styles.titleLine, { width: '90%', backgroundColor: baseSkeletonColor, marginTop: 8 }, animatedStyle]} />
        <Animated.View style={[styles.titleLine, { width: '60%', backgroundColor: baseSkeletonColor, marginTop: 4 }, animatedStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  videoCard: {
    width: cardWidth,
    borderRadius: 12,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, 
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12,
  },
  contentPlaceholder: {
    padding: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  textLinesPlaceholder: {
    flex: 1,
  },
  textLine: {
    height: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
  titleLine: {
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
  },
});

export default VideoCardSkeleton;