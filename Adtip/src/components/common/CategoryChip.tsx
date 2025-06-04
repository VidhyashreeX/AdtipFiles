// src/components/common/CategoryChip.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

interface Category {
  id: string | number;
  name: string;
  color?: string;
}

interface CategoryChipProps {
  category: Category;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  onPress,
  selected = false,
  style,
  textStyle,
  small = false,
}) => {
  const {colors} = useTheme();

  // Determine the chip color based on the category's color or use the theme primary color
  const chipColor = category.color || colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? chipColor + '20' : 'transparent',
          borderColor: chipColor,
          paddingVertical: small ? 4 : 6,
          paddingHorizontal: small ? 10 : 12,
        },
        style,
      ]}
      disabled={!onPress}>
      <Text
        style={[
          styles.text,
          {
            color: chipColor,
            fontSize: small ? 12 : 14,
          },
          textStyle,
        ]}
        numberOfLines={1}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CategoryChip;
