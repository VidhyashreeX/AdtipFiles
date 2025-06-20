import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError('');
      try {
        let token = await AsyncStorage.getItem('accessToken');
        if (!token) token = await AsyncStorage.getItem('@auth_token');
        if (!user?.id || !token) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        const res = await fetch(`https://api.adtip.in/api/user-premium-plans/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.status) throw new Error(data.message || 'Failed to fetch plans');
        // Only show active and queued plans
        const filtered = (data.data || []).filter((p: any) => p.status === 'active' || p.status === 'queued');
        setPlans(filtered.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#fff' }] }>
      <Text style={[styles.title, { color: isDarkMode ? colors.primary : colors.secondary }]}>My Premium Plans</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: colors.error, marginTop: 24 }}>{error}</Text>
      ) : plans.length === 0 ? (
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
        onPress={() => navigation.navigate('UpgradePremiumScreen')}
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
});

export default UserPremiumPlans; 