import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext'; 
import { useTabNavigator } from '../../contexts/TabNavigatorContext'; 

const ProfilePageSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  
  let contentPaddingBottom = 0;
  try {
    const tabNavigator = useTabNavigator();
    contentPaddingBottom = tabNavigator.contentPaddingBottom;
  } catch (error) {
    contentPaddingBottom = Platform.OS === 'ios' ? 80 : 60; 
  }

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
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Static Gradient Header */}
      <View style={[styles.gradientHeaderPlaceholder, { backgroundColor: colors.skeleton.background }]} />

      {/* Static Avatar */}
      <View style={styles.avatarContainerPlaceholder}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.skeleton.background }]} />
      </View>

      {/* User Info with animated text */}
      <View style={styles.userInfoContainerPlaceholder}>
        <Animated.View style={[styles.namePlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        <Animated.View style={[styles.handlePlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        <Animated.View style={[styles.bioPlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        <Animated.View style={[styles.bioPlaceholderLine2, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        <Animated.View style={[styles.locationPlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
      </View>

      {/* Stats with static containers and animated text */}
      <View style={[styles.statsContainerPlaceholder, { backgroundColor: colors.card }]}>
        <View style={styles.statItemPlaceholderContainer}>
          <Animated.View style={[styles.statValuePlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[styles.statLabelPlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
        <View style={[styles.statDividerPlaceholder, { backgroundColor: colors.skeleton.background }]} />
        <View style={styles.statItemPlaceholderContainer}>
          <Animated.View style={[styles.statValuePlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[styles.statLabelPlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
        <View style={[styles.statDividerPlaceholder, { backgroundColor: colors.skeleton.background }]} />
        <View style={styles.statItemPlaceholderContainer}>
          <Animated.View style={[styles.statValuePlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
          <Animated.View style={[styles.statLabelPlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        </View>
      </View>

      {/* Static Action Buttons */}
      <View style={styles.actionButtonsPlaceholder}>
        <View style={[styles.editButtonPlaceholder, { backgroundColor: colors.skeleton.background }]} />
        <View style={[styles.settingsButtonPlaceholder, { backgroundColor: colors.skeleton.background }]} />
      </View>

      {/* Static Posts Grid */}
      <View style={styles.postsGridPlaceholder}>
        {Array(6).fill(0).map((_, index) => (
          <View key={`post_sk_${index}`} style={[styles.postItemPlaceholder, { backgroundColor: colors.skeleton.background }]} />
        ))}
      </View>

      {/* Menu with static containers and animated text */}
      <View style={[styles.menuContainerPlaceholder, { backgroundColor: colors.card }]}>
        <Animated.View style={[styles.menuTitlePlaceholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
        {Array(3).fill(0).map((_, index) => (
          <View key={`menu_sk_${index}`} style={styles.menuItemPlaceholder}>
            <View style={[styles.menuIconPlaceholder, { backgroundColor: colors.skeleton.background }]} />
            <View style={styles.menuTextPlaceholderContainer}>
              <Animated.View style={[styles.menuTextLine1Placeholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
              <Animated.View style={[styles.menuTextLine2Placeholder, { backgroundColor: colors.skeleton.background }, pulseStyle]} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gradientHeaderPlaceholder: { 
    height: 120, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
  },
  avatarContainerPlaceholder: { 
    alignItems: 'center', 
    marginTop: -48, 
  },
  avatarPlaceholder: { 
    width: 90, 
    height: 90, 
    borderRadius: 45,
  },
  userInfoContainerPlaceholder: { 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    marginTop: 8,
    marginBottom: 16,
  },
  namePlaceholder: { width: '50%', height: 22, borderRadius: 11, marginBottom: 10 },
  handlePlaceholder: { width: '35%', height: 16, borderRadius: 8, marginBottom: 10 },
  bioPlaceholder: { width: '75%', height: 14, borderRadius: 7, marginBottom: 6 },
  bioPlaceholderLine2: { width: '65%', height: 14, borderRadius: 7, marginBottom: 10 },
  locationPlaceholder: { width: '45%', height: 14, borderRadius: 7 },
  statsContainerPlaceholder: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    marginHorizontal: 16, 
    marginBottom: 16, 
    paddingVertical: 10, 
    elevation: 1, 
  },
  statItemPlaceholderContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValuePlaceholder: {
    width: '40%',
    height: 18,
    borderRadius: 9,
    marginBottom: 6,
  },
  statLabelPlaceholder: {
    width: '60%',
    height: 13,
    borderRadius: 7,
  },
  statDividerPlaceholder: {
    width: 1,
    height: '60%', 
    alignSelf: 'center',
  },
  actionButtonsPlaceholder: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginBottom: 20, 
    alignItems: 'center',
  },
  editButtonPlaceholder: { 
    flex: 1, 
    height: 44, 
    borderRadius: 16, 
    marginRight: 12,
  },
  settingsButtonPlaceholder: { 
    width: 44, 
    height: 44, 
    borderRadius: 16,
  },
  postsGridPlaceholder: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 12, 
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  postItemPlaceholder: { 
    width: '31.5%', 
    aspectRatio: 1, 
    borderRadius: 8, 
    marginBottom: (100 * 0.035 * 0.5), 
  },
  menuContainerPlaceholder: { 
    borderRadius: 20, 
    marginHorizontal: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 1,
  },
  menuTitlePlaceholder: { 
    width: '30%', 
    height: 20, 
    borderRadius: 10, 
    marginBottom: 16,
    marginLeft: 4, 
  },
  menuItemPlaceholder: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  menuIconPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 14,
  },
  menuTextPlaceholderContainer: { 
    flex: 1,
  },
  menuTextLine1Placeholder: { 
    width: '60%', 
    height: 16, 
    borderRadius: 8, 
    marginBottom: 8,
  },
  menuTextLine2Placeholder: { 
    width: '80%', 
    height: 13, 
    borderRadius: 7,
  },
});

export default ProfilePageSkeleton;