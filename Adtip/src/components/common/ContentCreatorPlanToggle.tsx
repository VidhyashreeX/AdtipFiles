import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';

interface Props {
  onPress: () => void;
  style?: ViewStyle;
}

const ContentCreatorPlanToggle: React.FC<Props> = ({ onPress, style }) => {
  const { isContentCreatorPremium, isLoading } = useContentCreatorPremium();
  const toggleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetValue = isContentCreatorPremium ? 1 : 0;
    Animated.timing(toggleAnimation, {
      toValue: targetValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [toggleAnimation, isContentCreatorPremium]);

  const switchWidth = 44;
  const switchHeight = 24;
  const circleSize = 20;
  const circleOffset = 2;

  const backgroundColor = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF4444', '#4CAF50'],
  });

  const circlePosition = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circleOffset, switchWidth - circleSize - circleOffset],
  });

  return (
    <TouchableOpacity
      style={[styles.premiumToggleContainer, style, { opacity: isLoading ? 0.6 : 1 }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <Animated.View
        style={[
          styles.premiumToggleBackground,
          {
            backgroundColor,
            width: switchWidth,
            height: switchHeight,
            borderRadius: switchHeight / 2,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.premiumToggleCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              transform: [{ translateX: circlePosition }],
            }
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  premiumToggleContainer: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumToggleBackground: {
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  premiumToggleCircle: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default ContentCreatorPlanToggle; 