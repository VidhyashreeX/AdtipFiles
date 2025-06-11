import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext';

const StoryItemSkeleton: React.FC<{ isAddStory?: boolean }> = ({ isAddStory }) => {
  const { colors, isDarkMode } = useTheme();
  const skeletonBackgroundColor = isDarkMode ? colors.gray?.[700] || '#3A3A3C' : colors.gray?.[200] || '#E1E1E1';
  const skeletonHighlightColor = isDarkMode ? colors.gray?.[600] || '#4A4A4C' : colors.gray?.[50] || '#F0F0F0';

  if (isAddStory) {
    // Simplified placeholder for "Add Story"
    return (
      <SkeletonPlaceholder backgroundColor={skeletonBackgroundColor} highlightColor={skeletonHighlightColor} speed={1000}>
        <View style={styles.addStoryContainer}>
          <View style={styles.addStoryCircle} />
        </View>
      </SkeletonPlaceholder>
    );
  }

  return (
    <SkeletonPlaceholder backgroundColor={skeletonBackgroundColor} highlightColor={skeletonHighlightColor} speed={1000}>
      <View style={styles.container}>
        <View style={styles.avatar} />
        <View style={styles.username} />
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
    width: 70, // Approx width of StoryItem
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
    borderRadius: 4,
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
    // backgroundColor will be handled by SkeletonPlaceholder
  },
});

export default StoryItemSkeleton;