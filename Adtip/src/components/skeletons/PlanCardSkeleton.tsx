import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if necessary

const PlanCardSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const placeholderColor = isDarkMode ? colors.skeletonDark : colors.skeletonLight;
  const highlightColor = isDarkMode ? colors.skeletonHighlightDark : colors.skeletonHighlightLight;

  return (
    <View style={[styles.planContainer, { backgroundColor: colors.card }]}>
      <SkeletonPlaceholder backgroundColor={placeholderColor} highlightColor={highlightColor}>
        <View style={styles.item}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, marginRight: 10 }} />
            <View style={{ width: 150, height: 20, borderRadius: 4 }} />
          </View>
          <View style={{ width: '80%', height: 16, borderRadius: 4, marginBottom: 12 }} />
          <View style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 16 }} />
          <View style={{ width: '100%', height: 40, borderRadius: 10 }} />
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = StyleSheet.create({
  planContainer: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  item: {
    // Structure matches SkeletonPlaceholder items
  },
});

export default PlanCardSkeleton;