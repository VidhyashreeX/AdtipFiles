import { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { categories } from '@/utils/dummyData';

interface CategorySelectorProps {
  onSelectCategory: (categoryId: string) => void;
}

export default function CategorySelector({ onSelectCategory }: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('1'); // Default to 'All'

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onSelectCategory(categoryId);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && styles.selectedCategory,
            ]}
            onPress={() => handleCategoryPress(category.id)}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  selectedCategory: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#FFF',
    fontWeight: '500',
  },
});