import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {Star, ShoppingCart} from 'lucide-react-native';
import {Button} from '../ui/Button';

interface ProductItemProps {
  image: string;
  title: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  deliveryDate?: string;
  sponsored?: boolean;
  onAddToCart: () => void;
  onPress: () => void;
}

export function ProductItem({
  image,
  title,
  rating,
  reviewCount,
  price,
  originalPrice,
  discount,
  deliveryDate,
  sponsored = false,
  onAddToCart,
  onPress,
}: ProductItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {sponsored && <Text style={styles.sponsored}>Sponsored</Text>}
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{uri: image}} style={styles.image} />
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={14}
                  color={star <= rating ? '#fbbf24' : '#e5e7eb'}
                  fill={star <= rating ? '#fbbf24' : 'none'}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>({reviewCount})</Text>
          </View>

          {discount && discount > 0 && (
            <View style={styles.dealBadge}>
              <Text style={styles.dealText}>Limited time deal</Text>
            </View>
          )}

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{price}</Text>
            {originalPrice && (
              <Text style={styles.originalPrice}>M.R.P. ₹{originalPrice}</Text>
            )}
            {discount && discount > 0 && (
              <Text style={styles.discount}>{discount}% off</Text>
            )}
          </View>

          {deliveryDate && (
            <Text style={styles.delivery}>FREE delivery {deliveryDate}</Text>
          )}

          <Button
            title="Add to cart"
            variant="primary"
            fullWidth
            style={styles.addButton}
            onPress={e => {
              e.stopPropagation();
              onAddToCart();
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sponsored: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#6b7280',
    fontSize: 13,
  },
  content: {
    padding: 12,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  details: {},
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  dealBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dealText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  delivery: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#f59e0b',
  },
});
