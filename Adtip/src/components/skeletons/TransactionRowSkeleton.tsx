import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../../contexts/ThemeContext'; // Adjust path if necessary

const TransactionRowSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const placeholderColor = isDarkMode ? colors.skeletonDark : colors.skeletonLight;
  const highlightColor = isDarkMode ? colors.skeletonHighlightDark : colors.skeletonHighlightLight;

  return (
    <View style={[styles.transactionRow, { borderBottomColor: colors.borderLight }]}>
      <SkeletonPlaceholder backgroundColor={placeholderColor} highlightColor={highlightColor}>
        <View style={styles.item}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <View style={{ width: '80%', height: 18, borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: '60%', height: 14, borderRadius: 4 }} />
          </View>
          <View style={{ width: 80, height: 20, borderRadius: 4 }} />
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionRow: {
    paddingVertical: 16,
    paddingHorizontal: 8, // Match TransactionItem if it has horizontal padding
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default TransactionRowSkeleton;