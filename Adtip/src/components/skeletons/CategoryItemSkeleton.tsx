import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext';

const CategoryItemSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const skeletonBackgroundColor = isDarkMode ? colors.gray?.[700] || '#3A3A3C' : colors.gray?.[200] || '#E1E1E1';
  const skeletonHighlightColor = isDarkMode ? colors.gray?.[600] || '#4A4A4C' : colors.gray?.[50] || '#F0F0F0';

  return (
    <SkeletonPlaceholder backgroundColor={skeletonBackgroundColor} highlightColor={skeletonHighlightColor} speed={1000}>
      <View style={styles.container} />
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 36, // Approx height of CategoryItem
    width: 80,  // Approx width
    borderRadius: 18,
    marginRight: 8,
    // backgroundColor will be handled by SkeletonPlaceholder
  },
});

export default CategoryItemSkeleton;