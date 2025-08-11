// src/screens/tipshop/TipShopScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

// Components
import Header from '../../components/common/Header';
import ProductCard from '../../components/tipshop/ProductCard';

// Context
import {useTheme} from '../../contexts/ThemeContext';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discounted_price: number | null;
  images: string[];
  rating: number;
  reviews_count: number;
  seller: {
    id: number;
    name: string;
    image: string | null;
  };
  is_featured: boolean;
}

const TipShopScreen: React.FC = () => {
  // Hooks
  const {colors} = useTheme();
  const navigation = useNavigation();

  // State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock categories
  const categories: Category[] = [
    {id: 'fashion', name: 'Fashion', icon: 'shopping-bag'},
    {id: 'electronics', name: 'Electronics', icon: 'smartphone'},
    {id: 'beauty', name: 'Beauty', icon: 'star'},
    {id: 'home', name: 'Home', icon: 'home'},
    {id: 'sports', name: 'Sports', icon: 'activity'},
    {id: 'toys', name: 'Toys', icon: 'gift'},
  ];

  // Mock fetch products
  const fetchProducts = () => {
    setLoading(true);

    // Sample image URLs
    const sampleImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a',
    ];

    // Generate mock products
    const generateProducts = (count: number): Product[] => {
      return Array.from({length: count}, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam quis aliquam ultricies.',
        price: Math.floor(Math.random() * 300) + 20,
        discounted_price:
          Math.random() > 0.5 ? Math.floor(Math.random() * 200) + 10 : null,
        images: [sampleImages[i % sampleImages.length]],
        rating: 3 + Math.random() * 2,
        reviews_count: Math.floor(Math.random() * 500),
        seller: {
          id: i + 1,
          name: `Seller ${i + 1}`,
          image:
            Math.random() > 0.3
              ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'
              : null,
        },
        is_featured: Math.random() > 0.7,
      }));
    };

    // Mock API response
    setTimeout(() => {
      try {
        const mockProducts = generateProducts(20);

        setFeaturedProducts(mockProducts.filter(p => p.is_featured));
        setNewArrivals(mockProducts.slice(0, 5));
        setPopularProducts(mockProducts.slice(5, 10));

        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, 800);
  };

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId === activeCategory ? null : categoryId);
    // In a real app, we would filter products based on category
  };

  const handleProductPress = (productId: number) => {
    // Navigate to product detail
    // @ts-expect-error ProductDetail screen not yet defined in navigation types
    navigation.navigate('ProductDetail', {productId});
  };

  const handleSeeAllPress = (section: string) => {
    // Navigate to product listing with filter
    // @ts-expect-error ProductListing screen not yet defined in navigation types
    navigation.navigate('ProductListing', {section});
  };

  const handleSearchPress = () => {
    // Navigate to search screen
    // @ts-expect-error Search screen not yet defined in navigation types
    navigation.navigate('Search', {source: 'shop'});
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  // Render functions
  const renderCategoryItem = ({item}: {item: Category}) => (
    <TouchableOpacity
      style={getCategoryItemStyle(item.id)}
      onPress={() => handleCategoryPress(item.id)}>
      <View style={getCategoryIconStyle(item.id)}>
        <Icon
          name={item.icon}
          size={20}
          color={activeCategory === item.id ? colors.primary : colors.primary}
        />
      </View>
      <Text style={getCategoryNameStyle(item.id)}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, onSeeAllPress: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
        {title}
      </Text>
      <TouchableOpacity onPress={onSeeAllPress}>
        <Text style={[styles.seeAllText, {color: colors.primary}]}>
          See All
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHorizontalProducts = (
    products: Product[],
    title: string,
    section: string,
  ) => (
    <View style={styles.productsSection}>
      {renderSectionHeader(title, () => handleSeeAllPress(section))}
      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item.id)}
          />
        )}
        contentContainerStyle={styles.horizontalListContent}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={{color: colors.text.secondary}}>
              No products available
            </Text>
          </View>
        }
      />
    </View>
  );

  const renderFeaturedProducts = () => {
    if (featuredProducts.length === 0) {
      return null;
    }

    return (
      <View style={styles.featuredSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.featuredScrollView}>
          {featuredProducts.map(product => (
            <TouchableOpacity
              key={`featured-${product.id}`}
              style={styles.featuredItem}
              onPress={() => handleProductPress(product.id)}>
              <Image
                source={{uri: product.images[0]}}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.featuredOverlay,
                  styles.featuredOverlayBg, // new style for backgroundColor
                ]}>
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle}>{product.name}</Text>
                  <View style={styles.featuredPriceContainer}>
                    <Text style={styles.featuredPrice}>
                      ${product.discounted_price || product.price}
                    </Text>
                    {product.discounted_price && (
                      <Text style={styles.featuredOriginalPrice}>
                        ${product.price}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.featuredButton,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={() => handleProductPress(product.id)}>
                    <Text style={styles.featuredButtonText}>Shop Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // For category item dynamic styles
  const getCategoryItemStyle = (itemId: string) => [
    styles.categoryItem,
    activeCategory === itemId && [
      styles.activeCategoryItem,
      {backgroundColor: colors.primary},
    ],
  ];
  const getCategoryIconStyle = (itemId: string) => [
    styles.categoryIcon,
    {
      backgroundColor:
        activeCategory === itemId ? colors.white : colors.primary + '15',
    },
  ];
  const getCategoryNameStyle = (itemId: string) => [
    styles.categoryName,
    {
      color:
        activeCategory === itemId ? colors.white : colors.text.primary,
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="TipShop" showLogo={false} />

      <View style={[styles.searchBar, {backgroundColor: colors.gray[100]}]}>
        <TouchableOpacity
          style={styles.searchBarInner}
          onPress={handleSearchPress}>
          <Icon name="search" size={18} color={colors.text.tertiary} />
          <Text style={[styles.searchText, {color: colors.text.tertiary}]}>
            Search products...
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.primary}]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{color: colors.primary}}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.categoriesContainer}>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {renderFeaturedProducts()}

          {renderHorizontalProducts(
            newArrivals,
            'New Arrivals',
            'new-arrivals',
          )}

          {renderHorizontalProducts(
            popularProducts,
            'Popular Products',
            'popular',
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  searchText: {
    marginLeft: 8,
    fontSize: 14,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeCategoryItem: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  featuredSection: {
    height: 200,
    marginVertical: 16,
  },
  featuredScrollView: {
    height: 200,
  },
  featuredItem: {
    width: 320,
    height: 200,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  featuredOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  featuredPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  featuredOriginalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginLeft: 6,
    color: 'rgba(255,255,255,0.7)',
  },
  featuredButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productsSection: {
    marginVertical: 16,
  },
  horizontalListContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  emptyListContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
});

export default TipShopScreen;
