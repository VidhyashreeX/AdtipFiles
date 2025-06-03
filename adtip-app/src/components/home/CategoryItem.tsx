// app/components/home/CategoryItem.tsx
import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

interface CategoryItemProps {
  name: string;
  selected?: boolean;
  onPress: () => void;
}

export function CategoryItem({
  name,
  selected = false,
  onPress,
}: CategoryItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selectedContainer]}
      onPress={onPress}>
      <Text style={[styles.text, selected && styles.selectedText]}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f1f5f9',
  },
  selectedContainer: {
    backgroundColor: '#24d05a',
  },
  text: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedText: {
    color: 'white',
    fontWeight: '500',
  },
});
