// src/screens/content/SelectCategoryScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';
import CategoryChip from '../../components/common/CategoryChip';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import {ENDPOINTS} from '../../constants/api';

interface Category {
  id: string;
  name: string;
  color?: string;
}

const SelectCategoryScreen = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  // @ts-ignore
  const {onSelect, selectedCategory} = route.params || {};

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Category | null>(
    selectedCategory || null,
  );

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get(ENDPOINTS.GET_CATEGORIES);
      setCategories(response.data);
      setFilteredCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      setLoading(false);
    }
  };

  const handleSelectCategory = (category: Category) => {
    setSelected(category);
    if (onSelect) {
      onSelect(category);
      navigation.goBack();
    }
  };

  const renderItem = ({item}: {item: Category}) => {
    const isSelected = selected?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.categoryItemSelected,
        ]}
        onPress={() => handleSelectCategory(item)}>
        <CategoryChip category={item} selected={isSelected} />
        {isSelected && <Icon name="check" size={20} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: colors.background}]}> {/* flex: 1 moved to StyleSheet */}
      <Header
        title="Select Category"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>
        {/* Search box */}
        <View
          style={[styles.searchContainer, {backgroundColor: colors.gray[100]}]}>
          <Icon name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, {color: colors.text.primary}]}
            placeholder="Search categories"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, {color: colors.error}]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, {backgroundColor: colors.primary}]}
              onPress={fetchCategories}>
              <Text style={{color: colors.white}}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredCategories}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, {color: colors.text.secondary}]}>
                  {searchQuery.length > 0
                    ? 'No matching categories found'
                    : 'No categories available'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#f3f4f6', // fallback, will be overridden inline with colors.gray[100]
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default SelectCategoryScreen;
