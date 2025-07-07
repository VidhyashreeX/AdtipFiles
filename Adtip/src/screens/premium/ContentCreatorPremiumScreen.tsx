// ContentCreatorPremiumScreen.tsx
// Adapted from PremiumUserScreen for content creator premium
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/common/Header';
import { useNavigation } from '@react-navigation/native';

const ContentCreatorPremiumScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Log when subscription data changes
  useEffect(() => {
    console.log('🔄 [ContentCreatorPremiumScreen] Subscription data changed:', {
      hasData: !!subscriptionData,
      data: subscriptionData ? {
        planName: subscriptionData.plan_name,
        amount: subscriptionData.amount,
        status: subscriptionData.status,
        isActive: subscriptionData.is_active
      } : null
    });
  }, [subscriptionData]);

  useEffect(() => {
    console.log('🏠 [ContentCreatorPremiumScreen] Component mounted for user:', user?.id);
    fetchSubscriptionStatus();
  }, [user?.id]);

  const fetchSubscriptionStatus = async () => {
    console.log('🚀 [ContentCreatorPremiumScreen] Fetching content creator premium status for user:', user?.id);
    
    if (!user?.id) {
      console.error('❌ [ContentCreatorPremiumScreen] User ID not available');
      return;
    }
    try {
      setLoading(true);
      console.log('📡 [ContentCreatorPremiumScreen] Making API call to getContentPremiumStatus...');
      
      const response = await ApiService.getContentPremiumStatus(user.id);
      console.log('📥 [ContentCreatorPremiumScreen] API Response:', {
        status: response.status,
        hasData: !!response.data,
        data: response.data,
        message: response.message
      });
      
      if (response.status && response.data) {
        console.log('✅ [ContentCreatorPremiumScreen] Setting subscription data:', {
          planName: response.data.plan_name,
          amount: response.data.amount,
          status: response.data.status,
          isActive: response.data.is_active
        });
        setSubscriptionData(response.data);
      } else {
        console.log('ℹ️ [ContentCreatorPremiumScreen] No subscription found - setting data to null');
        setSubscriptionData(null);
      }
    } catch (error: any) {
      console.error('❌ [ContentCreatorPremiumScreen] Error fetching content creator premium status:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      Alert.alert('Error', 'Unable to load subscription details. Please try again later.', [{ text: 'OK' }]);
      setSubscriptionData(null);
    } finally {
      setLoading(false);
      console.log('🏁 [ContentCreatorPremiumScreen] Fetch subscription status completed');
    }
  };

  const handleCancelSubscription = async () => {
    console.log('🔄 [ContentCreatorPremiumScreen] Cancel subscription dialog opened');
    
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your content creator premium subscription? You will lose access to premium features at the end of your current billing cycle.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            console.log('🚀 [ContentCreatorPremiumScreen] User confirmed content creator subscription cancellation');
            
            try {
              if (!user?.id) {
                console.error('❌ [ContentCreatorPremiumScreen] User ID not available for cancellation');
                Alert.alert('Error', 'User ID not available');
                return;
              }
              
              console.log('📡 [ContentCreatorPremiumScreen] Making API call to cancelContentPremiumSubscription...');
              setCancelling(true);
              
              const response = await ApiService.cancelContentPremiumSubscription(user.id);
              console.log('📥 [ContentCreatorPremiumScreen] Cancel subscription API response:', {
                status: response.status,
                message: response.message,
                data: response.data
              });
              
              if (response.status) {
                console.log('✅ [ContentCreatorPremiumScreen] Content creator subscription cancelled successfully');
                Alert.alert('Success', response.message);
                fetchSubscriptionStatus();
              } else {
                console.log('❌ [ContentCreatorPremiumScreen] Failed to cancel content creator subscription:', response.message);
                Alert.alert('Error', response.message || 'Failed to cancel subscription');
              }
            } catch (error: any) {
              console.error('❌ [ContentCreatorPremiumScreen] Error cancelling content creator subscription:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data
              });
              Alert.alert('Error', 'An error occurred while cancelling subscription');
            } finally {
              setCancelling(false);
              console.log('🏁 [ContentCreatorPremiumScreen] Cancel subscription process completed');
            }
          }
        }
      ]
    );
  };

  const handleUpgradeSubscription = () => {
    console.log('🚀 [ContentCreatorPremiumScreen] User clicked upgrade content creator subscription, navigating to ContentCreatorSubscriptionScreen');
    navigation.navigate('ContentCreatorSubscriptionScreen');
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
        <Header title="Content Creator Premium Status" showSearch={false} showWallet={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading subscription details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Header title="Content Creator Premium Status" showSearch={false} showWallet={false} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {subscriptionData ? (
          <>
            {/* Premium Status Card */}
            <View style={[styles.statusCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}> 
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.statusGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.statusHeader}>
                  <Icon name="award" size={32} color="#fff" />
                  <Text style={styles.statusTitle}>Content Creator Premium Active</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscriptionData.status) + '20' }]}> 
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(subscriptionData.status) }]}>{getStatusText(subscriptionData.status)}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Subscription Details */}
            <View style={[styles.detailsCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Subscription Details</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Plan</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>{subscriptionData.plan_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Amount</Text>
                <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '600' }]}>₹{subscriptionData.amount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Billing Cycle</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>{subscriptionData.billing_cycle}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Started On</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>{formatDate(subscriptionData.start_at)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Next Billing</Text>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>{formatDate(subscriptionData.current_end_at)}</Text>
              </View>
            </View>

            {/* Premium Benefits */}
            <View style={[styles.benefitsCard, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Premium Benefits</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>Upload paid videos and earn more</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>Higher ad view earnings</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>Access to premium content creation tools</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {subscriptionData.status === 'active' && (
                <TouchableOpacity style={[styles.cancelButton, { opacity: cancelling ? 0.6 : 1 }]} onPress={handleCancelSubscription} disabled={cancelling} activeOpacity={0.8}>
                  {cancelling ? (
                    <View style={styles.loadingButtonContent}>
                      <ActivityIndicator color="#EF4444" size="small" />
                      <Text style={styles.cancelButtonText}>Cancelling...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Icon name="x-circle" size={18} color="#EF4444" />
                      <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              {(subscriptionData.status === 'cancelled' || subscriptionData.status === 'expired') && (
                <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeSubscription} activeOpacity={0.8}>
                  <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
              <Text style={[styles.noSubscriptionTitle, { color: colors.text.primary }]}>No Active Creator Subscription</Text>
              <Text style={[styles.noSubscriptionSubtitle, { color: colors.text.secondary }]}>Upgrade to content creator premium to unlock exclusive benefits and earn more</Text>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeSubscription} activeOpacity={0.8}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <View style={styles.buttonContent}>
                    <Icon name="star" size={18} color="#fff" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Content Creator Premium</Text>
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 16, fontSize: 16 },
  statusCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  statusGradient: { padding: 24 },
  statusHeader: { alignItems: 'center' },
  statusTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  detailsCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  benefitsCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 20 },
  benefitsList: { marginTop: 8 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  benefitText: { marginLeft: 8, fontSize: 14 },
  actionButtons: { marginHorizontal: 20, marginBottom: 20 },
  cancelButton: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  cancelButtonText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  loadingButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upgradeButton: { borderRadius: 8, overflow: 'hidden', marginTop: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14 },
  upgradeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  noSubscriptionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  noSubscriptionCard: { alignItems: 'center', padding: 32, borderRadius: 16 },
  noSubscriptionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  noSubscriptionSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 16 },
});

export default ContentCreatorPremiumScreen; 