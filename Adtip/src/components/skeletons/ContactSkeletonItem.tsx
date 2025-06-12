import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ContactSkeletonItem: React.FC = () => {
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
    <View style={[styles.contactItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
      <View style={styles.contactInfo}>
        {/* Static avatar */}
        <View 
          style={[
            styles.avatarPlaceholder, 
            { backgroundColor: colors.skeleton.background }
          ]} 
        />
        
        <View style={styles.textBlock}>
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
              { width: '50%', marginTop: 8, backgroundColor: colors.skeleton.background }, 
              pulseStyle
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.callButtons}>
        {/* Static call buttons */}
        <View 
          style={[
            styles.callButtonPlaceholder, 
            { backgroundColor: colors.skeleton.background }
          ]} 
        />
        <View 
          style={[
            styles.callButtonPlaceholder, 
            { backgroundColor: colors.skeleton.background, marginLeft: 12 }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  contactInfo: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  textLine: {
    height: 14,
    borderRadius: 7,
  },
  callButtons: { 
    flexDirection: 'row', 
    marginLeft: 16 
  },
  callButtonPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default ContactSkeletonItem;