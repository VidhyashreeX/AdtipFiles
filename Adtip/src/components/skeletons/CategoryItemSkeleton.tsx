import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const CategoryItemSkeleton: React.FC = () => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.skeleton.background }]} />
  );
};

const styles = StyleSheet.create({
  container: {
    height: 36,
    width: 80,
    borderRadius: 18,
    marginRight: 8,
  },
});

export default CategoryItemSkeleton;