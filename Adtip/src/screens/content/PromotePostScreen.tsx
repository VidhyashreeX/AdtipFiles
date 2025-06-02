// src/screens/content/PromotePostScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface PromotionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  estimatedReach: number;
  features: string[];
  popular?: boolean;
}

const PromotePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState('');
  const [promotionGoal, setPromotionGoal] = useState('');

  const postData = (route.params as any)?.post;

  const promotionPackages: PromotionPackage[] = [
    {
      id: 'basic',
      name: 'Basic Boost',
      description: 'Get your content seen by more people',
      price: 5.99,
      duration: 3,
      estimatedReach: 1000,
      features: [
        'Promoted for 3 days',
        'Reach up to 1,000 users',
        'Basic targeting',
        'Performance analytics'
      ],
    },
    {
      id: 'standard',
      name: 'Standard Boost',
      description: 'Amplify your reach with targeted promotion',
      price: 14.99,
      duration: 7,
      estimatedReach: 5000,
      features: [
        'Promoted for 7 days',
        'Reach up to 5,000 users',
        'Advanced targeting',
        'Detailed analytics',
        'Priority placement'
      ],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium Boost',
      description: 'Maximum exposure for your content',
      price: 29.99,
      duration: 14,
      estimatedReach: 15000,
      features: [
        'Promoted for 14 days',
        'Reach up to 15,000 users',
        'Premium targeting',
        'Comprehensive analytics',
        'Top priority placement',
        'Cross-platform promotion'
      ],
    },
  ];

  const audienceOptions = [
    'All Users',
    'Content Creators',
    'Video Enthusiasts',
    'Tech Interested',
    'Entertainment Seekers',
    'Educational Content Viewers',
  ];

  const goalOptions = [
    'Increase Views',
    'Get More Followers',
    'Boost Engagement',
    'Drive Traffic',
    'Brand Awareness',
    'Lead Generation',
  ];

  const handlePromote = async () => {
    if (!selectedPackage) {
      Alert.alert('Please select a promotion package');
      return;
    }

    if (!targetAudience) {
      Alert.alert('Please select your target audience');
      return;
    }

    if (!promotionGoal) {
      Alert.alert('Please select your promotion goal');
      return;
    }

    try {
      setLoading(true);
      
      // Mock promotion setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const selectedPkg = promotionPackages.find(pkg => pkg.id === selectedPackage);
      
      Alert.alert(
        'Promotion Started!',
        `Your post is now being promoted with the ${selectedPkg?.name} package. You'll start seeing results within the next few hours.`,
        [
          {
            text: 'View Analytics',
            onPress: () => navigation.navigate('Analytics' as never),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error starting promotion:', error);
      Alert.alert('Error', 'Failed to start promotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Promote Post" showBackButton />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Preview */}
        {postData && (
          <View style={[styles.postPreview, { backgroundColor: colors.surface }]}>
            <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
              Promoting Post
            </Text>
            <Text style={[styles.postTitle, { color: colors.text.primary }]} numberOfLines={2}>
              {postData.title || 'Your Post'}
            </Text>
            <Text style={[styles.postDescription, { color: colors.text.secondary }]} numberOfLines={3}>
              {postData.description || 'Post description will be shown here...'}
            </Text>
          </View>
        )}

        {/* Promotion Packages */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Choose Promotion Package
          </Text>
          {promotionPackages.map((pkg) => (
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
              onPress={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.popularBadgeText, { color: colors.white }]}>
                    Most Popular
                  </Text>
                </View>
              )}
              
              <View style={styles.packageHeader}>
                <Text style={[styles.packageName, { color: colors.text.primary }]}>
                  {pkg.name}
                </Text>
                <Text style={[styles.packagePrice, { color: colors.primary }]}>
                  ${pkg.price}
                </Text>
              </View>
              
              <Text style={[styles.packageDescription, { color: colors.text.secondary }]}>
                {pkg.description}
              </Text>
              
              <View style={styles.packageStats}>
                <View style={styles.statItem}>
                  <Icon name="clock" size={16} color={colors.text.secondary} />
                  <Text style={[styles.statText, { color: colors.text.secondary }]}>
                    {pkg.duration} days
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="users" size={16} color={colors.text.secondary} />
                  <Text style={[styles.statText, { color: colors.text.secondary }]}>
                    Up to {formatNumber(pkg.estimatedReach)} reach
                  </Text>
                </View>
              </View>
              
              <View style={styles.featuresList}>
                {pkg.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Icon name="check" size={14} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
              
              {selectedPackage === pkg.id && (
                <View style={styles.selectedIndicator}>
                  <Icon name="check-circle" size={24} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Audience */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Target Audience
          </Text>
          <View style={styles.optionsGrid}>
            {audienceOptions.map((audience) => (
              <TouchableOpacity
                key={audience}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: targetAudience === audience ? colors.primary : colors.surface,
                    borderColor: targetAudience === audience ? colors.primary : colors.border.light,
                  }
                ]}
                onPress={() => setTargetAudience(audience)}
              >
                <Text style={[
                  styles.optionText,
                  {
                    color: targetAudience === audience ? colors.white : colors.text.primary,
                  }
                ]}>
                  {audience}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promotion Goal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Promotion Goal
          </Text>
          <View style={styles.optionsGrid}>
            {goalOptions.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: promotionGoal === goal ? colors.primary : colors.surface,
                    borderColor: promotionGoal === goal ? colors.primary : colors.border.light,
                  }
                ]}
                onPress={() => setPromotionGoal(goal)}
              >
                <Text style={[
                  styles.optionText,
                  {
                    color: promotionGoal === goal ? colors.white : colors.text.primary,
                  }
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
            • Promotion results may vary based on content quality and audience engagement
          </Text>
          <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
            • Analytics will be available during and after the promotion period
          </Text>
          <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
            • Refunds are not available once promotion has started
          </Text>
        </View>
      </ScrollView>

      {/* Promote Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.promoteButton,
            {
              backgroundColor: selectedPackage ? colors.primary : colors.border.light,
              opacity: loading ? 0.7 : 1,
            }
          ]}
          onPress={handlePromote}
          disabled={!selectedPackage || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[
              styles.promoteButtonText,
              {
                color: selectedPackage ? colors.white : colors.text.tertiary,
              }
            ]}>
              Start Promotion
              {selectedPackage && promotionPackages.find(p => p.id === selectedPackage) && 
                ` - $${promotionPackages.find(p => p.id === selectedPackage)?.price}`
              }
            </Text>
          )}
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
  postPreview: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  packageCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  packageDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  packageStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsSection: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 11,
    marginBottom: 4,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  promoteButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  promoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PromotePostScreen;
