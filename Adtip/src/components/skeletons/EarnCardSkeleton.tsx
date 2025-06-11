import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext';

const EarnCardSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const skeletonBackgroundColor = isDarkMode ? colors.gray?.[700] || '#3A3A3C' : colors.gray?.[200] || '#E1E1E1';
  const skeletonHighlightColor = isDarkMode ? colors.gray?.[600] || '#4A4A4C' : colors.gray?.[50] || '#F0F0F0';

  return (
    <SkeletonPlaceholder backgroundColor={skeletonBackgroundColor} highlightColor={skeletonHighlightColor} speed={1000}>
      <View style={styles.container}>
        <View style={styles.icon} />
        <View style={styles.textContainer}>
          <View style={styles.title} />
          <View style={styles.description} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    height: 80, // Approx height of EarnCard
    // backgroundColor will be handled by SkeletonPlaceholder
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  description: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
});

export default EarnCardSkeleton;