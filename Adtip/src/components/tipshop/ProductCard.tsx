// src/components/tipshop/ProductCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

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

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.white }]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        {product.discounted_price && (
          <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.discountText}>
              {Math.round(((product.price - product.discounted_price) / product.price) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingContainer}>
          <Icon name="star" size={12} color="#FFD700" solid={true} />
          <Text style={[styles.rating, { color: colors.text.secondary }]}>
            {product.rating.toFixed(1)} ({product.reviews_count})
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text.primary }]}>
            ${product.discounted_price || product.price}
          </Text>
          {product.discounted_price && (
            <Text style={[styles.originalPrice, { color: colors.text.tertiary }]}>
              ${product.price}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    height: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
});

export default ProductCard;
