import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { IndianRupee } from 'lucide-react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import YouTubePlayer from '../../components/common/YouTubePlayer';
import {useNavigation} from '@react-navigation/native';

const EarnMoneyUserScreen: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const {premiumState} = useAuth();
  const navigation = useNavigation();

  // Check if user has premium
  const isPremium = premiumState.isPremium;

  // Earning opportunities data
  const earningOpportunities = [
    {
      id: 'watching',
      title: 'Watching Content',
      icon: 'play-circle',
      iconBgColor: '#FEF6FB',
      iconColor: '#CB1C8D',
      items: [
        { label: 'Watch Videos & InShorts', regular: '₹0.03 per ad', premium: 'up to ₹10 per ad' }
      ]
    },
    {
      id: 'calls',
      title: 'Call Earnings',
      icon: 'phone',
      iconBgColor: '#F0F9FF',
      iconColor: '#0091FF',
      items: [
        { label: 'Audio Calls', regular: '₹0.60/min', premium: '₹2/min' },
        { label: 'Video Calls', regular: '₹2/min', premium: '₹4/min' }
      ]
    },
    {
      id: 'pricing',
      title: 'Call Charges (User-Set Pricing)',
      icon: 'indian-rupee',
      iconBgColor: '#FFFAEB',
      iconColor: '#F6A723',
      items: [
        { label: 'Audio', regular: '₹7/min', premium: '₹4/min' },
        { label: 'Video', regular: '₹14/min', premium: '₹7/min' }
      ]
    },
    {
      id: 'additional',
      title: 'Additional Earning Methods',
      icon: 'gift',
      iconBgColor: '#FFF5F5',
      iconColor: '#F87171',
      items: [
        { label: 'Install apps & complete tasks for rewards', single: true },
        { label: 'Post promotional ads for business visibility', single: true },
        { label: 'Refer 1000 users → get 1 month free Content Creator Premium', single: true }
      ]
    }
  ];

  const financialDetails = {
    withdrawalRates: { regular: '60% kept', premium: '70% kept' },
    minimumWithdrawal: { regular: '₹5000', premium: '₹1000' },
    earningLimits: { regular: '₹2000', premium: '₹20,000' },
    benefits: [
      'Premium users get priority withdrawal processing',
      'Earnings can be withdrawn or spent on app features'
    ]
  };

  const renderEarningCard = (opportunity: any) => (
    <View key={opportunity.id} style={[styles.earningCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, {backgroundColor: opportunity.iconBgColor}]}>
          {opportunity.icon === 'indian-rupee' ? (
            <IndianRupee size={24} color={opportunity.iconColor} />
          ) : (
            <Icon name={opportunity.icon} size={24} color={opportunity.iconColor} />
          )}
        </View>
        <Text style={[styles.cardTitle, {color: colors.text.primary}]}>{opportunity.title}</Text>
      </View>
      
      <View style={styles.itemsContainer}>
        {opportunity.items.map((item: any, index: number) => (
          <View key={index} style={styles.earningItem}>
            <Text style={[styles.itemLabel, {color: colors.text.secondary}]}>{item.label}</Text>
            {item.single ? null : (
              <View style={styles.earningValues}>
                <View style={styles.valueContainer}>
                  <Text style={[styles.valueLabel, {color: colors.text.tertiary}]}>Regular</Text>
                  <Text style={[styles.valueAmount, {color: colors.text.primary}]}>{item.regular}</Text>
                </View>
                <View style={styles.valueContainer}>
                  <Text style={[styles.valueLabel, {color: '#10B981'}]}>Premium</Text>
                  <Text style={[styles.valueAmount, {color: '#10B981', fontWeight: '600'}]}>{item.premium}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderFinancialDetailsCard = () => (
    <View style={[styles.financialCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={['#FF6B00', '#FF8A00']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.financialIcon}>
          <Icon name="trending-up" size={24} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.cardTitle, {color: colors.text.primary}]}>Financial Details</Text>
      </View>

      <View style={styles.financialGrid}>
        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, {color: colors.text.secondary}]}>Withdrawal Rates:</Text>
          <View style={styles.financialValues}>
            <Text style={[styles.financialValue, {color: colors.text.primary}]}>{financialDetails.withdrawalRates.regular}</Text>
            <Text style={[styles.financialValue, {color: '#10B981', fontWeight: '600'}]}>{financialDetails.withdrawalRates.premium}</Text>
          </View>
        </View>

        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, {color: colors.text.secondary}]}>Minimum Withdrawal:</Text>
          <View style={styles.financialValues}>
            <Text style={[styles.financialValue, {color: colors.text.primary}]}>{financialDetails.minimumWithdrawal.regular}</Text>
            <Text style={[styles.financialValue, {color: '#10B981', fontWeight: '600'}]}>{financialDetails.minimumWithdrawal.premium}</Text>
          </View>
        </View>

        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, {color: colors.text.secondary}]}>Earning Limits:</Text>
          <View style={styles.financialValues}>
            <Text style={[styles.financialValue, {color: colors.text.primary}]}>{financialDetails.earningLimits.regular}</Text>
            <Text style={[styles.financialValue, {color: '#10B981', fontWeight: '600'}]}>{financialDetails.earningLimits.premium}</Text>
          </View>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        {financialDetails.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={[styles.benefitText, {color: colors.text.secondary}]}>{benefit}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderGetStartedCard = () => {
    if (isPremium) return null; // Don't show for premium users

    return (
      <View style={[styles.getStartedCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.getStartedGradient}>
          <View style={styles.getStartedContent}>
            <Icon name="trending-up" size={32} color="#FFFFFF" />
            <View style={styles.getStartedText}>
              <Text style={styles.getStartedTitle}>Ready to Start Earning More?</Text>
              <Text style={styles.getStartedSubtitle}>Upgrade to Premium and unlock higher earning rates</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('PremiumUser' as never)}
          >
            <Text style={styles.getStartedButtonText}>Get Premium</Text>
            <Icon name="arrow-right" size={16} color="#10B981" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Earn Money as a User"
        showWallet={false}
        showSearch={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderGetStartedCard()}
        {earningOpportunities.map(renderEarningCard)}
        {renderFinancialDetailsCard()}

        {/* Tutorial Video */}
        <YouTubePlayer
          videoId="oV0Wt8tui2Q"
          title="How to Earn Money as a User - Tutorial"
          height={220}
        />
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
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  earningCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  financialCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  financialIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemsContainer: {
    gap: 12,
  },
  earningItem: {
    paddingVertical: 8,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  earningValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 16,
  },
  valueContainer: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  financialGrid: {
    gap: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    flex: 1,
  },
  financialValues: {
    flexDirection: 'row',
    gap: 16,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  getStartedCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  getStartedGradient: {
    padding: 20,
  },
  getStartedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  getStartedText: {
    flex: 1,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  getStartedSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default EarnMoneyUserScreen;
