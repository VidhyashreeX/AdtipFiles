// src/screens/analytics/AnalyticsScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import ApiService from '../../services/ApiService';
import WithdrawalForm from '../../components/withdrawal/WithdrawalForm';
import PremiumPopup from '../../components/common/PremiumPopup';

interface AnalyticsData {
  channel_name: string;
  channel_image: string;
  channel_followers: number;
  total_videos: number;
  total_paid_views: number;
  total_normal_views: number;
  total_views: number;
  paid_video_earned: string;
  withdrawn: string;
  available_balance: string;
}

type RootStackParamList = {
  Analytics: { channelId: string };
};

type AnalyticsScreenRouteProp = RouteProp<RootStackParamList, 'Analytics'>;

const AnalyticsScreen: React.FC = () => {
  const {colors} = useTheme();
  const {user, premiumState} = useAuth();
  const isPremium = premiumState.isPremium;
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<AnalyticsScreenRouteProp>();
  const { channelId } = route.params;
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>(
    '30d',
  );
  const [isWithdrawalModalVisible, setIsWithdrawalModalVisible] = useState(false);

  const periods = [
    {id: '7d' as const, label: 'Last 7 days'},
    {id: '30d' as const, label: 'Last 30 days'},
    {id: '90d' as const, label: 'Last 3 months'},
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    if (!channelId) {
      console.error('No channel ID provided to AnalyticsScreen');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await ApiService.getChannelAnalytics(channelId);
      if (response.status === true && response.data) {
        setAnalytics(response.data);
      } else {
        console.error('Failed to fetch analytics data:', response.message);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, {backgroundColor: colors.surface}]}>
      <View style={[styles.statIcon, {backgroundColor: color + '20'}]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statTitle, {color: colors.text.secondary}]}>
        {title}
      </Text>
      <Text style={[styles.statValue, {color: colors.text.primary}]}>
        {value}
      </Text>
    </View>
  );

  const handleWithdraw = () => {
    const availableBalance = parseFloat(analytics?.available_balance || '0');
    if (!isPremium) {
      setShowPremiumPopup(true);
      return;
    }
    if (availableBalance < 1000) {
      Alert.alert('Minimum withdrawal amount is ₹1000 for premium users.');
      return;
    }
    setIsWithdrawalModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          title="Analytics"
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Analytics"
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period.id
                      ? colors.primary
                      : colors.surface,
                },
              ]}
              onPress={() => setSelectedPeriod(period.id)}>
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      selectedPeriod === period.id
                        ? colors.white
                        : colors.text.primary,
                  },
                ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Views"
            value={formatNumber(analytics?.total_views || 0)}
            icon="eye"
            color={colors.primary}
          />
          <StatCard
            title="Available Balance"
            value={`$${parseFloat(analytics?.available_balance || '0').toFixed(2)}`}
            icon="dollar-sign"
            color="#00C851"
          />
          <StatCard
            title="Followers"
            value={formatNumber(analytics?.channel_followers || 0)}
            icon="users"
            color="#FF4444"
          />
          <StatCard
            title="Total Videos"
            value={formatNumber(analytics?.total_videos || 0)}
            icon="video"
            color="#FF8800"
          />
        </View>

        {/* Top Performance */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Earnings Summary
          </Text>
          <View style={styles.topVideoCard}>
            <Icon name="trending-up" size={24} color={colors.success} />
            <View style={styles.topVideoInfo}>
              <Text
                style={[styles.topVideoTitle, {color: colors.text.primary}]}>
                Paid Video Earnings: ${parseFloat(analytics?.paid_video_earned || '0').toFixed(2)}
              </Text>
              <Text
                style={[styles.topVideoViews, {color: colors.text.secondary}]}>
                Withdrawn: ${parseFloat(analytics?.withdrawn || '0').toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Performance */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Views Breakdown
          </Text>
            <View
              style={[
                styles.statRow,
                {borderBottomColor: colors.border},
              ]}>
              <Text style={[styles.statDate, {color: colors.text.secondary}]}>
                Paid Views
              </Text>
              <View style={styles.statNumbers}>
                <Text style={[styles.statViews, {color: colors.text.primary}]}>
                  {formatNumber(analytics?.total_paid_views || 0)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statRow,
                {borderBottomColor: 'transparent'},
              ]}>
              <Text style={[styles.statDate, {color: colors.text.secondary}]}>
                Normal Views
              </Text>
              <View style={styles.statNumbers}>
                <Text style={[styles.statViews, {color: colors.text.primary}]}>
                  {formatNumber(analytics?.total_normal_views || 0)}
                </Text>
              </View>
            </View>
        </View>

        {/* Withdraw Earnings */}
        {parseFloat(analytics?.available_balance || '0') > 0 && (
          <TouchableOpacity
            style={[styles.withdrawButton, {backgroundColor: colors.primary}]}
            onPress={handleWithdraw}>
            <Icon name="dollar-sign" size={20} color={colors.white} />
            <Text style={[styles.withdrawButtonText, {color: colors.white}]}>
              Withdraw Earnings (${parseFloat(analytics?.available_balance || '0').toFixed(2)})
            </Text>
          </TouchableOpacity>
        )}

        {/* Export Data */}
        <TouchableOpacity
          style={[styles.exportButton, {backgroundColor: colors.surface}]}
          onPress={() => {
            // Handle export functionality
            console.log('Export analytics data');
          }}>
          <Icon name="download" size={20} color={colors.primary} />
          <Text style={[styles.exportButtonText, {color: colors.primary}]}>
            Export Analytics Data
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Withdrawal Form Modal */}
      <WithdrawalForm
        visible={isWithdrawalModalVisible}
        onClose={() => setIsWithdrawalModalVisible(false)}
        onSuccess={() => {
          // Refresh analytics data after successful withdrawal
          loadAnalytics();
        }}
        withdrawalType="content_earnings"
        availableBalance={parseFloat(analytics?.available_balance || '0')}
        userId={user?.id || 0}
        channelId={parseInt(channelId)}
      />

      <PremiumPopup
        visible={showPremiumPopup}
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => setShowPremiumPopup(false)}
      />
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
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  topVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topVideoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  topVideoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  topVideoViews: {
    fontSize: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statDate: {
    fontSize: 14,
  },
  statNumbers: {
    alignItems: 'flex-end',
  },
  statViews: {
    fontSize: 14,
    marginBottom: 2,
  },
  statEarnings: {
    fontSize: 12,
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default AnalyticsScreen;
