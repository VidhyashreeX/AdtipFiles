import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {Search, Heart, ShoppingCart} from 'lucide-react-native';
import {ProductItem} from '@/components/tipshop/ProductItem';

const DUMMY_PRODUCTS = [
  {
    id: '1',
    image: 'https://images.pexels.com/photos/5876695/pexels-photo-5876695.jpeg',
    title: 'Zeroharm Blood Puris | Plant-Based Detox Formula',
    rating: 5,
    reviewCount: 5,
    price: 949,
    originalPrice: 1199,
    discount: 21,
    deliveryDate: 'Sun, 25 May',
    sponsored: true,
  },
  {
    id: '2',
    image: 'https://images.pexels.com/photos/3373739/pexels-photo-3373739.jpeg',
    title: 'Manetain Curl Cream Soft Hold 200ml for Curly & Wavy Hair',
    rating: 4,
    reviewCount: 69,
    price: 854,
    originalPrice: 899,
    discount: 5,
    deliveryDate: 'Sun, 25 May',
    sponsored: true,
  },
  {
    id: '3',
    image: 'https://images.pexels.com/photos/3735149/pexels-photo-3735149.jpeg',
    title: 'Fitness Tracker Smart Watch | Heart Rate Monitor, Step Counter',
    rating: 4,
    reviewCount: 234,
    price: 1299,
    originalPrice: 1999,
    discount: 35,
    deliveryDate: 'Mon, 26 May',
    sponsored: false,
  },
  {
    id: '4',
    image: 'https://images.pexels.com/photos/1667088/pexels-photo-1667088.jpeg',
    title: 'Premium Leather Wallet for Men | RFID Blocking | 6 Card Slots',
    rating: 5,
    reviewCount: 87,
    price: 799,
    originalPrice: 1299,
    discount: 38,
    deliveryDate: 'Tue, 27 May',
    sponsored: false,
  },
];

export default function TipShopScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <ShoppingCart size={18} color="white" />
          </View>
          <Text style={styles.title}>Tip Shop</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.walletChip}>
            <Text style={styles.walletAmount}>$ 10.56</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Heart size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <ShoppingCart size={24} color="#64748b" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {DUMMY_PRODUCTS.map(product => (
          <ProductItem
            key={product.id}
            image={product.image}
            title={product.title}
            rating={product.rating}
            reviewCount={product.reviewCount}
            price={product.price}
            originalPrice={product.originalPrice}
            discount={product.discount}
            deliveryDate={product.deliveryDate}
            sponsored={product.sponsored}
            onAddToCart={() => {}}
            onPress={() => {}}
          />
        ))}

        {/* Add bottom padding to account for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#24d05a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletChip: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 12,
  },
  walletAmount: {
    color: '#24d05a',
    fontWeight: '600',
  },
  iconButton: {
    marginLeft: 8,
  },
  cartButton: {
    marginLeft: 16,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bottomPadding: {
    height: 80,
  },
});
