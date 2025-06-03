// src/components/home/CategoryItem.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CategoryItemProps {
  name: string;
  selected?: boolean;
  onPress: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ 
  name, 
  selected = false, 
  onPress 
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: selected ? colors.primary : colors.gray[100] },
        selected && styles.selectedContainer
      ]} 
      onPress={onPress}
    >
      <Text 
        style={[
          styles.text, 
          { color: selected ? colors.white : colors.text.secondary }
        ]}
      >
        {name ? String(name) : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CategoryItem;
