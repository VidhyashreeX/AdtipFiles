import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if necessary
import { useTabNavigator } from '../../contexts/TabNavigatorContext'; // For contentPaddingBottom

const ProfilePageSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  
  let contentPaddingBottom = 0;
  try {
    const tabNavigator = useTabNavigator();
    contentPaddingBottom = tabNavigator.contentPaddingBottom;
  } catch (error) {
    // Default padding if context is not available (e.g. in a storybook or test)
    contentPaddingBottom = Platform.OS === 'ios' ? 80 : 60; 
  }

  const skeletonBackgroundColor = isDarkMode ? colors.gray?.[800] || '#3A3A3C' : colors.gray?.[200] || '#E1E1E1';
  const skeletonHighlightColor = isDarkMode ? colors.gray?.[700] || '#4A4A4C' : colors.gray?.[50] || '#F0F0F0';

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      showsVerticalScrollIndicator={false}
    >
      <SkeletonPlaceholder backgroundColor={skeletonBackgroundColor} highlightColor={skeletonHighlightColor} speed={1000}>
        {/* Gradient Header Placeholder */}
        <View style={styles.gradientHeaderPlaceholder} />

        {/* Avatar Placeholder */}
        <View style={styles.avatarContainerPlaceholder}>
          <View style={styles.avatarPlaceholder} />
        </View>

        {/* User Info Placeholder */}
        <View style={styles.userInfoContainerPlaceholder}>
          <View style={styles.namePlaceholder} />
          <View style={styles.handlePlaceholder} />
          <View style={styles.bioPlaceholder} />
          <View style={styles.bioPlaceholderLine2} />
          <View style={styles.locationPlaceholder} />
        </View>

        {/* Stats Placeholder */}
        <View style={[styles.statsContainerPlaceholder, { backgroundColor: colors.card }]}>
          <View style={styles.statItemPlaceholderContainer}>
            <View style={styles.statValuePlaceholder} />
            <View style={styles.statLabelPlaceholder} />
          </View>
          <View style={styles.statDividerPlaceholder} />
          <View style={styles.statItemPlaceholderContainer}>
            <View style={styles.statValuePlaceholder} />
            <View style={styles.statLabelPlaceholder} />
          </View>
          <View style={styles.statDividerPlaceholder} />
          <View style={styles.statItemPlaceholderContainer}>
            <View style={styles.statValuePlaceholder} />
            <View style={styles.statLabelPlaceholder} />
          </View>
        </View>

        {/* Action Buttons Placeholder */}
        <View style={styles.actionButtonsPlaceholder}>
            <View style={styles.editButtonPlaceholder} />
            <View style={styles.settingsButtonPlaceholder} />
        </View>

        {/* Posts Grid Placeholder */}
        <View style={styles.postsGridPlaceholder}>
          {Array(6).fill(0).map((_, index) => (
            <View key={`post_sk_${index}`} style={styles.postItemPlaceholder} />
          ))}
        </View>

        {/* Menu Placeholder */}
        <View style={[styles.menuContainerPlaceholder, { backgroundColor: colors.card }]}>
            <View style={styles.menuTitlePlaceholder} />
            {Array(3).fill(0).map((_, index) => (
                <View key={`menu_sk_${index}`} style={styles.menuItemPlaceholder}>
                    <View style={styles.menuIconPlaceholder} />
                    <View style={styles.menuTextPlaceholderContainer}>
                        <View style={styles.menuTextLine1Placeholder} />
                        <View style={styles.menuTextLine2Placeholder} />
                    </View>
                </View>
            ))}
        </View>
      </SkeletonPlaceholder>
    </ScrollView>
  );
};

// Styles for ProfilePageSkeleton (approximating ProfileScreen styles)
const styles = StyleSheet.create({
  gradientHeaderPlaceholder: { 
    height: 120, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    // backgroundColor will be handled by SkeletonPlaceholder
  },
  avatarContainerPlaceholder: { 
    alignItems: 'center', 
    marginTop: -48, // To overlap with gradientHeaderPlaceholder
  },
  avatarPlaceholder: { 
    width: 90, 
    height: 90, 
    borderRadius: 45,
    // backgroundColor for the circle itself
  },
  userInfoContainerPlaceholder: { 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    marginTop: 8,
    marginBottom: 16,
  },
  namePlaceholder: { width: '50%', height: 22, borderRadius: 4, marginBottom: 10 },
  handlePlaceholder: { width: '35%', height: 16, borderRadius: 4, marginBottom: 10 },
  bioPlaceholder: { width: '75%', height: 14, borderRadius: 4, marginBottom: 6 },
  bioPlaceholderLine2: { width: '65%', height: 14, borderRadius: 4, marginBottom: 10 },
  locationPlaceholder: { width: '45%', height: 14, borderRadius: 4 },
  
  statsContainerPlaceholder: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    marginHorizontal: 16, 
    marginBottom: 16, 
    paddingVertical: 10, // Reduced padding for skeleton
    elevation: 1, // Minimal shadow for card structure
  },
  statItemPlaceholderContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValuePlaceholder: {
    width: '40%',
    height: 18,
    borderRadius: 4,
    marginBottom: 6,
  },
  statLabelPlaceholder: {
    width: '60%',
    height: 13,
    borderRadius: 4,
  },
  statDividerPlaceholder: {
    width: 1,
    height: '60%', // Relative height
    alignSelf: 'center',
    // backgroundColor will be handled by SkeletonPlaceholder
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
    paddingHorizontal: 12, // Match ProfileScreen's post container
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  postItemPlaceholder: { 
    width: '31.5%', // Adjust for spacing, (100 - (spacing*2)) / 3
    aspectRatio: 1, 
    borderRadius: 8, 
    marginBottom: (100 * 0.035 * 0.5), // ~1.75% of width for margin between items
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
    borderRadius: 4, 
    marginBottom: 16,
    marginLeft: 4, // Match ProfileScreen menu title style
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
    borderRadius: 4, 
    marginBottom: 8,
  },
  menuTextLine2Placeholder: { 
    width: '80%', 
    height: 13, 
    borderRadius: 4,
  },
});

export default ProfilePageSkeleton;