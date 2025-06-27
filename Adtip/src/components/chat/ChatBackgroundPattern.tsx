import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

const ChatBackgroundPattern = () => {
  const { isDarkMode } = useTheme();
  
  // Use a subtle color for the pattern that complements the background gradient
  const patternColor = isDarkMode ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.025)';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="pattern" patternUnits="userSpaceOnUse" width="35" height="35">
            <Circle cx="5" cy="5" r="1" fill={patternColor} />
            <Circle cx="25" cy="25" r="1" fill={patternColor} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#pattern)" />
      </Svg>
    </View>
  );
};

export default ChatBackgroundPattern; 