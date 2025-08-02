import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/common/Header';
import { useNavigation } from '@react-navigation/native';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainNavigatorParamList } from '../../types/navigation';

const { width, height } = Dimensions.get('window');

const UserPremiumBenefitsScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>();


  const handleTogglePress = () => {
    navigation.navigate('PremiumUser');
  };


  const renderFeatureComparison = () => {
    const freeFeatures = [
      { label: 'Earn per ad view', value: '₹0.03 Rupees' },
      { label: 'Platform fee', value: '60% +18% GST' },
      { label: 'Tip Call charge', value: '₹7 per minute' },
      { label: 'Maximum earnings', value: 'Upto ₹2000' },
      { label: 'Withdrawal processing', value: '30 business days' },
      { label: 'Tip Call acceptance', value: '₹1 per call' },
      { label: 'Minimum withdrawal', value: '₹2000' },
      { label: 'Creator earnings withdrawal', value: '₹5000' },
    ];

    const premiumFeatures = [
      { label: 'Earn per ad view', value: 'Upto ₹10' },
      { label: 'Platform fee', value: '30% +18% GST' },
      { label: 'Tip Call charge', value: '₹4 per minute' },
      { label: 'Maximum earnings', value: 'Upto ₹20000' },
      { label: 'Withdrawal processing', value: '14 business days' },
      { label: 'Tip Call acceptance', value: '₹2 per call' },
      { label: 'Minimum withdrawal', value: '₹1000' },
      { label: 'Creator earnings withdrawal', value: '₹1000' },
    ];

    return (
      <View style={styles.comparisonSection}>
        <Text style={[styles.comparisonTitle, { color: colors.text.primary }]}>
          Free vs Premium Benefits
        </Text>
        
        <View style={styles.comparisonContainer}>
          {/* Free Column */}
          <View style={[styles.comparisonColumn, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
            <View style={styles.planTypeHeader}>
              <Text style={[styles.planTypeTitle, { color: colors.text.secondary }]}>FREE</Text>
              <View style={[styles.planTypeBadge, { backgroundColor: colors.text.tertiary + '20' }]}>
                <Text style={[styles.planTypeBadgeText, { color: colors.text.tertiary }]}>Current</Text>
              </View>
            </View>
            
            {freeFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.featureLabel, { color: colors.text.secondary }]}>
                  {feature.label}
                </Text>
                <Text style={[styles.featureValue, { color: colors.text.primary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {feature.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Premium Column */}
          <View style={[styles.comparisonColumn, { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 1 }]}
            pointerEvents={user?.is_premium ? 'none' : 'auto'}
          >
            <View style={styles.planTypeHeader}>
              <Text style={[styles.planTypeTitle, { color: colors.primary }]}>PREMIUM</Text>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.planTypeBadge}
              >
                <Text style={styles.premiumBadgeText}>Upgrade</Text>
              </LinearGradient>
            </View>
            
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.featureLabel, { color: colors.text.secondary }]}>
                  {feature.label}
                </Text>
                <Text style={[styles.featureValue, { color: colors.primary, fontWeight: '600' }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {feature.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      {/* Content Creator Plan Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleHeader}>
          <Text style={[styles.toggleTitle, { color: colors.text.primary }]}>
            Premium Status
          </Text>
          <Text style={[styles.toggleSubtitle, { color: colors.text.secondary }]}>
            Tap to view subscription details
          </Text>
        </View>
        <ContentCreatorPlanToggle onPress={handleTogglePress} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Feature Comparison Section */}
        {renderFeatureComparison()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  comparisonSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    marginTop: 20,
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonColumn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  planTypeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  featureRow: {
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 16,
  },
  featureValue: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  toggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default UserPremiumBenefitsScreen; 