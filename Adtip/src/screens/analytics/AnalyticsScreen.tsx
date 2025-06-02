// src/screens/analytics/AnalyticsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface AnalyticsData {
  totalViews: number;
  totalEarnings: number;
  totalVideos: number;
  avgViewTime: string;
  topVideo: {
    title: string;
    views: number;
  };
  recentStats: {
    date: string;
    views: number;
    earnings: number;
  }[];
}

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const periods = [
    { id: '7d' as const, label: 'Last 7 days' },
    { id: '30d' as const, label: 'Last 30 days' },
    { id: '90d' as const, label: 'Last 3 months' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        totalViews: 125000,
        totalEarnings: 450.75,
        totalVideos: 23,
        avgViewTime: '3:45',
        topVideo: {
          title: 'Getting Started with React Native',
          views: 15000,
        },
        recentStats: [
          { date: '2024-06-01', views: 1200, earnings: 15.50 },
          { date: '2024-05-31', views: 980, earnings: 12.30 },
          { date: '2024-05-30', views: 1450, earnings: 18.75 },
          { date: '2024-05-29', views: 890, earnings: 11.20 },
          { date: '2024-05-28', views: 1100, earnings: 14.80 },
        ],
      };

      setAnalytics(mockData);
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

  const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statTitle, { color: colors.text.secondary }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.text.primary }]}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Analytics" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Analytics" showBackButton />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.id ? colors.primary : colors.surface,
                }
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period.id ? colors.white : colors.text.primary,
                }
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
            value={formatNumber(analytics?.totalViews || 0)}
            icon="eye"
            color={colors.primary}
          />
          <StatCard
            title="Total Earnings"
            value={`$${analytics?.totalEarnings.toFixed(2) || '0.00'}`}
            icon="dollar-sign"
            color="#00C851"
          />
          <StatCard
            title="Videos"
            value={analytics?.totalVideos.toString() || '0'}
            icon="video"
            color="#FF4444"
          />
          <StatCard
            title="Avg. View Time"
            value={analytics?.avgViewTime || '0:00'}
            icon="clock"
            color="#FF8800"
          />
        </View>

        {/* Top Performance */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Top Performing Video
          </Text>
          <View style={styles.topVideoCard}>
            <Icon name="trending-up" size={24} color={colors.success} />
            <View style={styles.topVideoInfo}>
              <Text style={[styles.topVideoTitle, { color: colors.text.primary }]}>
                {analytics?.topVideo.title}
              </Text>
              <Text style={[styles.topVideoViews, { color: colors.text.secondary }]}>
                {formatNumber(analytics?.topVideo.views || 0)} views
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Performance */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Recent Performance
          </Text>
          {analytics?.recentStats.map((stat, index) => (
            <View key={index} style={[styles.statRow, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.statDate, { color: colors.text.secondary }]}>
                {new Date(stat.date).toLocaleDateString()}
              </Text>
              <View style={styles.statNumbers}>
                <Text style={[styles.statViews, { color: colors.text.primary }]}>
                  {formatNumber(stat.views)} views
                </Text>
                <Text style={[styles.statEarnings, { color: colors.success }]}>
                  ${stat.earnings.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Export Data */}
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            // Handle export functionality
            console.log('Export analytics data');
          }}
        >
          <Icon name="download" size={20} color={colors.primary} />
          <Text style={[styles.exportButtonText, { color: colors.primary }]}>
            Export Analytics Data
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
});

export default AnalyticsScreen;
