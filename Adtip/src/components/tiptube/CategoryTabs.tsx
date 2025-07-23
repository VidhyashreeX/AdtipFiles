import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { TIPTUBE_THEME } from '../../utils/tiptubeTheme';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryName: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const { colors, isDarkMode } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const styles = createStyles(colors, isDarkMode);

  // Auto-scroll to selected category
  useEffect(() => {
    const selectedIndex = categories.findIndex(cat => cat.name === selectedCategory);
    if (selectedIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5, // Center the selected item
      });
    }
  }, [selectedCategory, categories]);

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => {
    const isSelected = selectedCategory === item.name;
    
    return (
      <Animated.View entering={FadeIn.delay(index * 30).duration(200)}>
        <TouchableOpacity
          onPress={() => onCategoryChange(item.name)}
          style={[
            styles.categoryButton,
            isSelected && styles.selectedCategoryButton
          ]}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.categoryButtonText,
            isSelected && styles.selectedCategoryButtonText
          ]}>
            {item.icon ? `${item.icon} ` : ''}{item.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.scrollContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure gracefully
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ 
              index: info.index, 
              animated: true,
              viewPosition: 0.5 
            });
          });
        }}
      />
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    scrollContent: {
      paddingHorizontal: 16,
    },
    separator: {
      width: 8,
    },
    categoryButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedCategoryButton: {
      backgroundColor: TIPTUBE_THEME.colors.primary,
      borderColor: TIPTUBE_THEME.colors.primary,
    },
    categoryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
      textAlign: 'center',
    },
    selectedCategoryButtonText: {
      color: '#FFFFFF',
    },
  });

export default CategoryTabs;
