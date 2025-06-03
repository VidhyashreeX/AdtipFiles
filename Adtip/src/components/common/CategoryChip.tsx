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

const getContainerStyle = (
  selected: boolean,
  chipColor: string,
  small: boolean,
  style?: ViewStyle,
): ViewStyle[] => [
  styles.container,
  {
    backgroundColor: selected ? chipColor + '20' : 'transparent', // '20' adds 20% opacity to the color
    borderColor: chipColor,
    paddingVertical: small ? 4 : 6,
    paddingHorizontal: small ? 10 : 12,
  },
  ...(style ? [style] : []), // Conditionally spread the provided style array
];

const getTextStyle = (
  chipColor: string,
  small: boolean,
  textStyle?: TextStyle,
): TextStyle[] => [
  styles.text,
  {
    color: chipColor,
    fontSize: small ? 12 : 14,
  },
  ...(textStyle ? [textStyle] : []), // Conditionally spread the provided textStyle array
];

const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  onPress,
  selected = false,
  style,
  textStyle,
  small = false,
}) => {
  const {colors} = useTheme();
  // Use category.color if provided, otherwise fall back to the primary theme color
  const chipColor = category.color || colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      // Apply styles dynamically based on props
      style={getContainerStyle(selected, chipColor, small, style)}
      disabled={!onPress} // Disable touch feedback if no onPress handler is provided
    >
      <Text
        // Apply text styles dynamically based on props
        style={getTextStyle(chipColor, small, textStyle)}
        numberOfLines={1} // Ensure text truncates if it's too long
      >
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
    marginRight: 8, // Spacing between chips
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CategoryChip;
