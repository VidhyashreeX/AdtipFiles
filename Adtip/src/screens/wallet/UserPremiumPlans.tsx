import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import WalletService from '../../services/WalletService';
import ApiService from '../../services/ApiService';
import { formatPremiumExpiryDate } from '../../utils/dateUtils';
import { useSubscriptionStatus } from '../../hooks/useQueries';

const { width } = Dimensions.get('window');

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PLAN_STATUS_COLORS: Record<string, string> = {
  active: '#24d05a',
  queued: '#f59e42',
};

const GOLD_GRADIENT = ['#FFD700', '#FFB300'];

const UserPremiumPlans: React.FC<{ isPremiumProp?: boolean }> = ({ isPremiumProp }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [isPremium, setIsPremium] = useState<boolean>(isPremiumProp ?? false);
  const [premiumLoading, setPremiumLoading] = useState(!isPremiumProp);
  const [premiumPlan, setPremiumPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  // Content Creator Premium states
  const [isContentPremium, setIsContentPremium] = useState<boolean>(false);
  const [contentPremiumLoading, setContentPremiumLoading] = useState(true);
  const [contentPremiumPlan, setContentPremiumPlan] = useState<any>(null);
  const [contentPremiumError, setContentPremiumError] = useState('');

  // Use TanStack Query for premium status when no prop is provided
  const {
    data: premiumResponse,
    isLoading: premiumQueryLoading,
    error: premiumQueryError,
  } = useSubscriptionStatus(user?.id || 0);

  // Fetch premium status if not provided as prop
  useEffect(() => {
    if (isPremiumProp !== undefined) {
      setIsPremium(isPremiumProp);
      setPremiumLoading(false);
      return;
    }

    // Use TanStack Query data
    if (premiumResponse) {
      // Check if premium is not expired - handle the API response format properly
      const isPremiumActive = !premiumResponse.is_premium_expired;
      setIsPremium(isPremiumActive);
      setPremiumPlan(isPremiumActive ? premiumResponse : null);
      setPremiumLoading(false);
    } else if (premiumQueryError) {
      // Handle error case - treat as no premium
      console.log('UserPremiumPlans: Premium query error, treating as no premium:', premiumQueryError);
      setIsPremium(false);
      setPremiumPlan(null);
      setPremiumLoading(false);
    } else if (!premiumQueryLoading) {
      // No data and not loading - treat as no premium
      setIsPremium(false);
      setPremiumPlan(null);
      setPremiumLoading(false);
    }
  }, [isPremiumProp, premiumResponse, premiumQueryLoading, premiumQueryError]);

  const fetchData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Only fetch new subscription status
      const subResponse = await ApiService.getSubscriptionStatus(user.id);

      if (subResponse?.status === true || subResponse?.status === 200) {
        setSubscription(subResponse.data);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchContentPremiumData = async () => {
    if (!user?.id) {
      setContentPremiumError('User not authenticated');
      setContentPremiumLoading(false);
      return;
    }
    setContentPremiumLoading(true);
    setContentPremiumError('');
    try {
      const contentPremiumResponse = await ApiService.getContentPremiumStatus(user.id);

      if (contentPremiumResponse?.status === true || contentPremiumResponse?.status === 200) {
        const isContentPremiumActive = !contentPremiumResponse.data?.is_premium_expired;
        setIsContentPremium(isContentPremiumActive);
        setContentPremiumPlan(isContentPremiumActive ? contentPremiumResponse.data : null);
      } else {
        setIsContentPremium(false);
        setContentPremiumPlan(null);
      }

    } catch (err: any) {
      setContentPremiumError(err.message || 'Failed to fetch content premium data');
      setIsContentPremium(false);
      setContentPremiumPlan(null);
    } finally {
      setContentPremiumLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchContentPremiumData();
  }, [user]);

  const renderSubscriptionCard = () => (
    <LinearGradient
        colors={isDarkMode ? ['#434343', '#2a2a2a'] : ['#F0F0F0', '#E0E0E0']}
        style={[styles.planBar, { borderColor: subscription.status === 'active' ? PLAN_STATUS_COLORS.active : colors.border }]}
    >
      <View style={styles.planBarRow}>
        <Text style={[styles.planName, { color: isDarkMode ? colors.text.primary : colors.primary }]}>{subscription.plan_name || 'Premium Subscription'}</Text>
        <Text style={[styles.status, { color: PLAN_STATUS_COLORS[subscription.status] || colors.primary }]}>{subscription.status.toUpperCase()}</Text>
      </View>
      <View style={styles.planBarRow}>
        <Text style={[styles.expiry, { color: colors.text.secondary }]}>
          {subscription.status === 'active' ? `Renews on: ${formatDate(subscription.current_end_at)}` : `Cancelled`}
        </Text>
      </View>
    </LinearGradient>
  );

  const renderContentPremiumCard = () => (
    <LinearGradient
        colors={isDarkMode ? ['#434343', '#2a2a2a'] : ['#F0F0F0', '#E0E0E0']}
        style={[styles.planBar, { borderColor: contentPremiumPlan.status === 'active' ? PLAN_STATUS_COLORS.active : colors.border }]}
    >
      <View style={styles.planBarRow}>
        <Text style={[styles.planName, { color: isDarkMode ? colors.text.primary : colors.primary }]}>{contentPremiumPlan.plan_name || 'Content Creator Premium'}</Text>
        <Text style={[styles.status, { color: PLAN_STATUS_COLORS[contentPremiumPlan.status] || colors.primary }]}>{contentPremiumPlan.status.toUpperCase()}</Text>
      </View>
      <View style={styles.planBarRow}>
        <Text style={[styles.expiry, { color: colors.text.secondary }]}>
          {contentPremiumPlan.status === 'active' ? `Renews on: ${formatDate(contentPremiumPlan.current_end_at)}` : `Cancelled`}
        </Text>
      </View>
    </LinearGradient>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#fff' }] }>
      <View style={[styles.sectionDivider, { borderBottomColor: isDarkMode ? colors.border : '#E0E0E0' }]} />
      <Text style={[styles.title, { color: isDarkMode ? colors.primary : colors.secondary }]}>My Premium Plans</Text>
      
      <TouchableOpacity
        style={[styles.upgradeBtn, { backgroundColor: colors.primary, marginBottom: 24 }]}
        onPress={() => navigation.navigate('PremiumUser' as never)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Upgrade Premium</Text>
      </TouchableOpacity>
      
      {premiumLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: colors.error, marginTop: 24 }}>{error}</Text>
      ) : isPremium && premiumPlan && premiumPlan.end_time ? (
        // Show premium active banner when premium is detected from subscription status API
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={[styles.planBar, { borderColor: '#4CAF50' }]}
        >
          <View style={styles.planBarRow}>
            <Text style={[styles.planName, { color: '#FFFFFF' }]}>✨ Premium Active</Text>
            <Text style={[styles.status, { color: '#FFFFFF' }]}>ACTIVE</Text>
          </View>
          <View style={styles.planBarRow}>
            <Text style={[styles.expiry, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              Expires: {formatPremiumExpiryDate(premiumPlan.end_time)}
            </Text>
          </View>
        </LinearGradient>
      ) : !subscription ? (
        <LinearGradient
          colors={GOLD_GRADIENT}
          style={[styles.noPlanBar, { borderColor: GOLD_GRADIENT[0] }]}
        >
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.noPlanText}>No active premium plans</Text>
          <Text style={styles.noPlanSubText}>Activate to get premium features!</Text>
        </LinearGradient>
      ) : (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}>
          {subscription && renderSubscriptionCard()}
        </ScrollView>
      )}

      {/* Content Creator Premium Section */}
      <View style={[styles.sectionDivider, { borderBottomColor: isDarkMode ? colors.border : '#E0E0E0', marginTop: 32 }]} />
      <Text style={[styles.title, { color: isDarkMode ? colors.primary : colors.secondary }]}>My Content Creator Plans</Text>
      
      <TouchableOpacity
        style={[styles.upgradeBtn, { backgroundColor: colors.primary, marginBottom: 24 }]}
        onPress={() => navigation.navigate('ContentCreatorPremium' as never)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Upgrade Content Creator</Text>
      </TouchableOpacity>
      
      {contentPremiumLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      ) : contentPremiumError ? (
        <Text style={{ color: colors.error, marginTop: 24 }}>{contentPremiumError}</Text>
      ) : isContentPremium && contentPremiumPlan && contentPremiumPlan.end_time ? (
        // Show content premium active banner when premium is detected
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={[styles.planBar, { borderColor: '#4CAF50' }]}
        >
          <View style={styles.planBarRow}>
            <Text style={[styles.planName, { color: '#FFFFFF' }]}>✨ Content Creator Premium Active</Text>
            <Text style={[styles.status, { color: '#FFFFFF' }]}>ACTIVE</Text>
          </View>
          <View style={styles.planBarRow}>
            <Text style={[styles.expiry, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              Expires: {formatPremiumExpiryDate(contentPremiumPlan.end_time)}
            </Text>
          </View>
        </LinearGradient>
      ) : !contentPremiumPlan ? (
        <LinearGradient
          colors={GOLD_GRADIENT}
          style={[styles.noPlanBar, { borderColor: GOLD_GRADIENT[0] }]}
        >
          <Text style={styles.crownIcon}>🎬</Text>
          <Text style={styles.noPlanText}>No active content creator plans</Text>
          <Text style={styles.noPlanSubText}>Activate to get content creator features!</Text>
        </LinearGradient>
      ) : (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}>
          {contentPremiumPlan && renderContentPremiumCard()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  planBar: {
    width: width * 0.9,
    borderRadius: 18,
    padding: 18,
    marginVertical: 10,
    borderWidth: 2,
    elevation: 2,
  },
  planBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  status: {
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  expiry: {
    fontSize: 15,
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeBtn: {
    width: width * 0.7,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    elevation: 2,
  },
  noPlanBar: {
    width: width * 0.9,
    borderRadius: 18,
    padding: 22,
    marginVertical: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    flexDirection: 'column',
  },
  crownIcon: {
    fontSize: 38,
    marginBottom: 8,
    textAlign: 'center',
  },
  noPlanText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B8860B',
    textAlign: 'center',
    marginBottom: 4,
  },
  noPlanSubText: {
    fontSize: 15,
    color: '#B8860B',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionDivider: {
    width: '100%',
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  transactionsContainer: {
    width: width * 0.9,
    borderRadius: 18,
    padding: 18,
    marginVertical: 10,
    borderWidth: 2,
    elevation: 2,
  },
  transactionsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default UserPremiumPlans;