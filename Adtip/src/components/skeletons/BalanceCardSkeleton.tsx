import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if necessary

const BalanceCardSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const placeholderColor = isDarkMode ? colors.skeletonDark : colors.skeletonLight;
  const highlightColor = isDarkMode ? colors.skeletonHighlightDark : colors.skeletonHighlightLight;

  return (
    <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
      <SkeletonPlaceholder backgroundColor={placeholderColor} highlightColor={highlightColor}>
        <View style={styles.item}>
          <View style={{ width: 120, height: 20, borderRadius: 4, marginBottom: 10 }} />
          <View style={{ width: 180, height: 36, borderRadius: 4, marginBottom: 20 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%', height: 44, borderRadius: 10 }} />
            <View style={{ width: '48%', height: 44, borderRadius: 10 }} />
          </View>
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  item: {
    // Structure matches SkeletonPlaceholder items
  },
});

export default BalanceCardSkeleton;