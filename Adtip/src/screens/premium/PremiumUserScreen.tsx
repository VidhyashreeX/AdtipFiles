import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/common/Header';

const { width, height } = Dimensions.get('window');

const PremiumUserScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🏠 [PremiumUserScreen] Component mounted for user:', user?.id);
    fetchSubscriptionStatus();
  }, [user?.id]);

  const fetchSubscriptionStatus = async () => {
    console.log('🚀 [PremiumUserScreen] Fetching subscription status for user:', user?.id);
    
    if (!user?.id) {
      console.error('❌ [PremiumUserScreen] User ID not available');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 [PremiumUserScreen] Making API call to getSubscriptionStatus...');
      
      const response = await ApiService.getSubscriptionStatus(user.id);
      console.log('📥 [PremiumUserScreen] API Response:', {
        status: response.status,
        hasData: !!response.data,
        data: response.data,
        message: response.message
      });
      
      if (response.status && response.data) {
        console.log('✅ [PremiumUserScreen] Setting subscription data:', {
          planName: response.data.plan_name,
          amount: response.data.amount,
          status: response.data.status,
          isActive: response.data.is_active
        });
        setSubscriptionData(response.data);
      } else {
        // No subscription found - this is normal for new users
        console.log('ℹ️ [PremiumUserScreen] No subscription found - setting data to null');
        setSubscriptionData(null);
      }
    } catch (error: any) {
      console.error('❌ [PremiumUserScreen] Error fetching subscription status:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      Alert.alert(
        'Error',
        'Unable to load subscription details. Please try again later.',
        [{ text: 'OK' }]
      );
      setSubscriptionData(null);
    } finally {
      setLoading(false);
      console.log('🏁 [PremiumUserScreen] Fetch subscription status completed');
    }
  };



  const handleUpgradeSubscription = () => {
    console.log('🚀 [PremiumUserScreen] User clicked upgrade subscription, navigating to SubscriptionScreen');
    navigation.navigate('SubscriptionScreen');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'cancelled':
        return '#F59E0B';
      case 'expired':
        return '#EF4444';
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Premium Status"
          showSearch={false}
          showWallet={false}
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading subscription details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      <Header
        title="Premium Status"
        showSearch={false}
        showWallet={false}
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {subscriptionData ? (
          <>
            {/* Premium Status Card */}
            <View style={[styles.statusCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.statusGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statusHeader}>
                  <Icon name="award" size={32} color="#fff" />
                  <Text style={styles.statusTitle}>Premium Active</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscriptionData.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(subscriptionData.status) }]}>
                      {getStatusText(subscriptionData.status)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Subscription Details */}
            <View style={[styles.detailsCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Subscription Details
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Plan</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {subscriptionData.plan_name}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Amount</Text>
                <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '600' }]}>
                  ₹{subscriptionData.amount}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Billing Cycle</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {subscriptionData.billing_cycle}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Started On</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {formatDate(subscriptionData.start_at)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Next Billing</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {formatDate(subscriptionData.current_end_at)}
                </Text>
              </View>
            </View>

            {/* Premium Benefits */}
            <View style={[styles.benefitsCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Premium Benefits
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Earn up to ₹10 per ad view
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Reduced platform fee (30% + 18% GST)
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Lower tip call charges (₹4 per minute)
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Higher maximum earnings (₹20,000)
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Faster withdrawal processing (14 days)
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Lower minimum withdrawal (₹1,000)
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons - Cancel subscription moved to Settings */}
            <View style={styles.actionButtons}>
              
              {(subscriptionData.status === 'cancelled' || subscriptionData.status === 'expired') && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradeSubscription}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.buttonContent}>
                      <Icon name="refresh-cw" size={18} color="#fff" />
                      <Text style={styles.upgradeButtonText}>Renew Subscription</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          /* No Subscription State */
          <View style={styles.noSubscriptionContainer}>
            <View style={[styles.noSubscriptionCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
              <Icon name="award" size={64} color={colors.text.tertiary} />
              <Text style={[styles.noSubscriptionTitle, { color: colors.text.primary }]}>
                No Active Subscription
              </Text>
              <Text style={[styles.noSubscriptionSubtitle, { color: colors.text.secondary }]}>
                Upgrade to premium to unlock exclusive benefits and earn more
              </Text>
              
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradeSubscription}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.buttonContent}>
                    <Icon name="star" size={18} color="#fff" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 24,
  },
  statusHeader: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  benefitsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  actionButtons: {
    marginHorizontal: 20,
    gap: 12,
  },

  upgradeButton: {
    height: 56,
    borderRadius: 16,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noSubscriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noSubscriptionCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    width: '100%',
  },
  noSubscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noSubscriptionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default PremiumUserScreen; 