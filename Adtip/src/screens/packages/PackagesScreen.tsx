// src/screens/packages/PackagesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

const PackagesScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const packages = [
    { id: '1', name: '1 Month Plan', price: 200 },
    { id: '2', name: '6 Month Plan', price: 1200 },
    { id: '3', name: '1 Year Plan', price: 2400, bestValue: true },
  ];

  const handleSelectPackage = (packageId: string) => {
    const selectedPackage = packages.find((pkg) => pkg.id === packageId);
    if (selectedPackage) {
      Alert.alert('Selected Package', `You selected ${selectedPackage.name}`);
    } else {
      Alert.alert('Error', 'Package not found');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Premium Plans"/>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Premium Plans"/>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {packages.map((pkg) => (
          <View
            key={pkg.id}
            style={[styles.packageCard, { backgroundColor: colors.card }]}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packagePrice}>₹{pkg.price}</Text>
            {pkg.bestValue && (
              <Text style={styles.bestValueBadge}>Best Value</Text>
            )}
            <TouchableOpacity
              style={[styles.buyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Checkout', { package: pkg })}>
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  packageCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  packagePrice: {
    fontSize: 16,
    color: '#888',
  },
  bestValueBadge: {
    marginTop: 8,
    fontSize: 14,
    color: '#24d05a',
    fontWeight: 'bold',
  },
  buyButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PackagesScreen;