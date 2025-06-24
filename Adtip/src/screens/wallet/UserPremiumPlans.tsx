import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/ApiService';

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

const UserPremiumPlans = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Fetch both legacy plans and new subscription status
      const [plansResponse, subResponse] = await Promise.all([
        ApiService.getUserPremiumPlans(user.id),
        ApiService.getSubscriptionStatus(user.id).catch(e => e) // Catch error if no subscription
      ]);

      if (plansResponse.status) {
        const filtered = (plansResponse.data || []).filter((p: any) => p.status === 'active' || p.status === 'queued');
        setPlans(filtered.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()));
      }
      
      if (subResponse?.status) {
        setSubscription(subResponse.data);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel? Your premium benefits will continue until the end of the current billing period.",
      [
        { text: "Don't Cancel", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: async () => {
          setIsCancelling(true);
          try {
            const response = await ApiService.cancelSubscription();
            if (response.status) {
              Alert.alert("Success", "Your subscription has been scheduled for cancellation.");
              fetchData(); // Refresh data
            } else {
              Alert.alert("Error", response.message || "Could not cancel subscription.");
            }
          } catch (error: any) {
            Alert.alert("Error", error.message || "An error occurred during cancellation.");
          } finally {
            setIsCancelling(false);
          }
        }}
      ]
    );
  };

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
      {subscription.status === 'active' && (
        <TouchableOpacity 
          style={[styles.cancelButton, {backgroundColor: isDarkMode ? 'rgba(255, 80, 80, 0.1)' : 'rgba(255, 80, 80, 0.15)'}]} 
          onPress={handleCancelSubscription}
          disabled={isCancelling}
        >
          {isCancelling ? <ActivityIndicator color={colors.error} size="small" /> : <Text style={{ color: colors.error }}>Cancel Subscription</Text>}
        </TouchableOpacity>
      )}
    </LinearGradient>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#fff' }] }>
      <Text style={[styles.title, { color: isDarkMode ? colors.primary : colors.secondary }]}>My Premium Plans</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: colors.error, marginTop: 24 }}>{error}</Text>
      ) : plans.length === 0 && !subscription ? (
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
          {plans.map((plan, idx) => (
            <LinearGradient
              key={plan.id}
              colors={isDarkMode ? ['#232526', '#414345'] : ['#EAFBE3', '#E0F5D9']}
              style={[styles.planBar, { borderColor: PLAN_STATUS_COLORS[plan.status] || colors.primary }]}
            >
              <View style={styles.planBarRow}>
                <Text style={[styles.planName, { color: isDarkMode ? colors.text.primary : colors.primary }]}>{plan.plan_name}</Text>
                <Text style={[styles.status, { color: PLAN_STATUS_COLORS[plan.status] || colors.primary }]}>{plan.status.toUpperCase()}</Text>
              </View>
              <View style={styles.planBarRow}>
                <Text style={[styles.expiry, { color: colors.text.secondary }]}>Expiry: {formatDate(plan.end_time)}</Text>
                <Text style={[styles.price, { color: isDarkMode ? colors.text.tertiary : colors.text.secondary }]}>₹{plan.actual_price}</Text>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity
        style={[styles.upgradeBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
        onPress={() => navigation.navigate('SubscriptionScreen')}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Upgrade Premium</Text>
      </TouchableOpacity>
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
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default UserPremiumPlans; 