import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if necessary

const RelatedVideoCardSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  // Ensure you have these skeleton colors in your theme or use fallback values
  const placeholderColor = isDarkMode ? (colors.skeletonDark || '#333333') : (colors.skeletonLight || '#E1E9EE');
  const highlightColor = isDarkMode ? (colors.skeletonHighlightDark || '#555555') : (colors.skeletonHighlightLight || '#F2F8FC');

  return (
    <View style={[styles.relatedVideoCard, { backgroundColor: colors.card }]}>
      <SkeletonPlaceholder backgroundColor={placeholderColor} highlightColor={highlightColor}>
        <View style={styles.itemContainer}>
          <View style={styles.thumbnail} />
          <View style={styles.textContainer}>
            <View style={{ width: '90%', height: 16, borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: '60%', height: 12, borderRadius: 4, marginBottom: 6 }} />
            <View style={{ width: '70%', height: 10, borderRadius: 4 }} />
          </View>
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = StyleSheet.create({
  relatedVideoCard: { // Style to match your actual relatedVideoCard container
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden', // Important if your card has rounded corners
  },
  itemContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  thumbnail: { // Dimensions to match your relatedVideoThumbnail
    width: 120,
    height: 67,
    // No backgroundColor needed here, SkeletonPlaceholder handles it
  },
  textContainer: { // Style to match your relatedVideoContent
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
});

export default React.memo(RelatedVideoCardSkeleton);