// src/screens/packages/PackagesScreen.tsx
import React, { useState, useEffect } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  duration: string;
  popular: boolean;
  recommended: boolean;
}

const PackagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      
      // Mock packages data - replace with actual API call
      const mockPackages: Package[] = [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Perfect for getting started',
          price: 9.99,
          features: [
            'Upload up to 10 videos per month',
            'Basic analytics',
            'Community support',
            'Standard video quality'
          ],
          duration: 'monthly',
          popular: false,
          recommended: false,
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'For serious content creators',
          price: 19.99,
          originalPrice: 29.99,
          features: [
            'Upload up to 50 videos per month',
            'Advanced analytics',
            'Priority support',
            'HD video quality',
            'Custom thumbnails',
            'Live streaming'
          ],
          duration: 'monthly',
          popular: true,
          recommended: true,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'For professional creators and businesses',
          price: 39.99,
          features: [
            'Unlimited video uploads',
            'Comprehensive analytics',
            '24/7 priority support',
            '4K video quality',
            'Custom branding',
            'Live streaming',
            'Advanced monetization tools',
            'API access'
          ],
          duration: 'monthly',
          popular: false,
          recommended: false,
        }
      ];

      setPackages(mockPackages);
    } catch (error) {
      console.error('Error loading packages:', error);
      Alert.alert('Error', 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handleContinue = () => {
    if (!selectedPackage) {
      Alert.alert('Please select a package', 'Choose a package to continue');
      return;
    }

    const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
    navigation.navigate('ChoosePackages' as never, { package: selectedPkg } as never);
  };

  const renderPackageCard = (pkg: Package) => (
    <TouchableOpacity
      key={pkg.id}
      style={[
        styles.packageCard,
        {
          backgroundColor: colors.surface,
          borderColor: selectedPackage === pkg.id ? colors.primary : colors.border.light,
          borderWidth: selectedPackage === pkg.id ? 2 : 1,
        }
      ]}
      onPress={() => handleSelectPackage(pkg.id)}
    >
      {/* Package Header */}
      <View style={styles.packageHeader}>
        {pkg.popular && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>Most Popular</Text>
          </View>
        )}
        {pkg.recommended && (
          <View style={[styles.badge, styles.recommendedBadge, { backgroundColor: colors.success }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>Recommended</Text>
          </View>
        )}
        
        <Text style={[styles.packageName, { color: colors.text.primary }]}>{pkg.name}</Text>
        <Text style={[styles.packageDescription, { color: colors.text.secondary }]}>
          {pkg.description}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text.primary }]}>
            ${pkg.price}
          </Text>
          {pkg.originalPrice && (
            <Text style={[styles.originalPrice, { color: colors.text.tertiary }]}>
              ${pkg.originalPrice}
            </Text>
          )}
          <Text style={[styles.duration, { color: colors.text.secondary }]}>
            /{pkg.duration}
          </Text>
        </View>
      </View>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        {pkg.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check" size={16} color={colors.success} style={styles.checkIcon} />
            <Text style={[styles.featureText, { color: colors.text.secondary }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Selection Indicator */}
      {selectedPackage === pkg.id && (
        <View style={styles.selectedIndicator}>
          <Icon name="check-circle" size={24} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Choose Package" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Choose Package" showBackButton />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Select the package that best fits your content creation needs
          </Text>
        </View>

        <View style={styles.packagesContainer}>
          {packages.map(renderPackageCard)}
        </View>

        <View style={styles.comparisonNote}>
          <Text style={[styles.comparisonText, { color: colors.text.tertiary }]}>
            All plans include basic features and can be upgraded or downgraded at any time
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedPackage ? colors.primary : colors.border.light,
            }
          ]}
          onPress={handleContinue}
          disabled={!selectedPackage}
        >
          <Text style={[
            styles.continueButtonText,
            {
              color: selectedPackage ? colors.white : colors.text.tertiary,
            }
          ]}>
            Continue with {selectedPackage ? packages.find(p => p.id === selectedPackage)?.name : 'Selected'} Plan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  packagesContainer: {
    gap: 16,
  },
  packageCard: {
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  packageHeader: {
    marginBottom: 16,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedBadge: {
    top: -10,
    right: 60,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  duration: {
    fontSize: 16,
    marginLeft: 4,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  comparisonNote: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  comparisonText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PackagesScreen;
