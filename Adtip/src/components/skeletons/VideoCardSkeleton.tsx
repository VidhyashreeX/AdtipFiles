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
    <View style={[styles.videoCard, { backgroundColor: colors.card, shadowColor: colors.text.primary }]}>
      {/* Static thumbnail background */}
      <View 
        style={[
          styles.thumbnailPlaceholder, 
          { backgroundColor: colors.skeleton.background }
        ]} 
      />
      
      <View style={styles.contentPlaceholder}>
        <View style={styles.avatarRow}>
          {/* Static avatar */}
          <View 
            style={[
              styles.avatarPlaceholder, 
              { backgroundColor: colors.skeleton.background }
            ]} 
          />
          
          <View style={styles.textLinesPlaceholder}>
            {/* Animated text lines */}
            <Animated.View 
              style={[
                styles.textLine, 
                { width: '70%', backgroundColor: colors.skeleton.background }, 
                pulseStyle
              ]} 
            />
            <Animated.View 
              style={[
                styles.textLine, 
                { width: '50%', backgroundColor: colors.skeleton.background, marginTop: 4 }, 
                pulseStyle
              ]} 
            />
          </View>
        </View>
        
        {/* Animated title lines */}
        <Animated.View 
          style={[
            styles.titleLine, 
            { width: '90%', backgroundColor: colors.skeleton.background, marginTop: 8 }, 
            pulseStyle
          ]} 
        />
        <Animated.View 
          style={[
            styles.titleLine, 
            { width: '60%', backgroundColor: colors.skeleton.background, marginTop: 4 }, 
            pulseStyle
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  videoCard: {
    width: cardWidth,
    borderRadius: 12,
    marginBottom: 16,
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
    borderRadius: 5,
    marginBottom: 6,
  },
  titleLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
});

export default VideoCardSkeleton;