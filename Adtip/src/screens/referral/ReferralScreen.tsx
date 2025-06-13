import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition'; // ADD THIS IMPORT

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  thisMonthReferrals: number;
  thisMonthEarnings: number;
}

interface ReferralActivity {
  id: string;
  userName: string;
  action: 'joined' | 'first_purchase' | 'monthly_active';
  earnings: number;
  timestamp: Date;
  status: 'completed' | 'pending';
}

const ReferralScreen: React.FC = () => {
  const {colors} = useTheme();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    thisMonthReferrals: 0,
    thisMonthEarnings: 0,
  });
  const [activities, setActivities] = useState<ReferralActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = () => {
    // Simulate API call
    setTimeout(() => {
      const mockStats: ReferralStats = {
        totalReferrals: 12,
        totalEarnings: 45.5,
        pendingEarnings: 8.0,
        thisMonthReferrals: 3,
        thisMonthEarnings: 12.5,
      };

      const mockActivities: ReferralActivity[] = [
        {
          id: '1',
          userName: 'John Doe',
          action: 'joined',
          earnings: 2.0,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: 'completed',
        },
        {
          id: '2',
          userName: 'Sarah Smith',
          action: 'first_purchase',
          earnings: 5.0,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          status: 'pending',
        },
        {
          id: '3',
          userName: 'Mike Johnson',
          action: 'monthly_active',
          earnings: 3.0,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          status: 'completed',
        },
        {
          id: '4',
          userName: 'Emma Wilson',
          action: 'joined',
          earnings: 2.0,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          status: 'completed',
        },
      ];

      setStats(mockStats);
      setActivities(mockActivities);
      setIsLoading(false);
    }, 1000);
  };

  const handleShare = async () => {
    try {
      const shareUrl = 'https://adtip.app/invite/ADTIP123';
      const message = `Join me on Adtip and earn money watching videos and creating content! Use my referral code: ADTIP123\n\n${shareUrl}`;

      await Share.share({
        message,
        url: shareUrl,
        title: 'Join Adtip and Earn Money!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyReferralCode = () => {
    Clipboard.setString('ADTIP123');
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const copyReferralLink = () => {
    const shareUrl = 'https://adtip.app/invite/ADTIP123';
    Clipboard.setString(shareUrl);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'joined':
        return 'user-plus';
      case 'first_purchase':
        return 'shopping-cart';
      case 'monthly_active':
        return 'activity';
      default:
        return 'user';
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'joined':
        return 'joined using your code';
      case 'first_purchase':
        return 'made their first purchase';
      case 'monthly_active':
        return 'stayed active this month';
      default:
        return 'completed an action';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const renderStatCard = (title: string, value: string, subtitle?: string) => (
    <View style={[styles.statCard, {backgroundColor: colors.surface}]}>
      <Text style={[styles.statValue, {color: colors.primary}]}>{value}</Text>
      <Text style={[styles.statTitle, {color: colors.text.primary}]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, {color: colors.text.secondary}]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderActivity = ({item}: {item: ReferralActivity}) => (
    <View
      style={[styles.activityItem, {borderBottomColor: colors.border.light}]}>
      <View
        style={[
          styles.activityIconContainer,
          {backgroundColor: colors.primary + '20'},
        ]}>
        <Icon
          name={getActionIcon(item.action)}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.activityContent}>
        <Text style={[styles.activityUser, {color: colors.text.primary}]}>
          {item.userName}
        </Text>
        <Text
          style={[styles.activityDescription, {color: colors.text.secondary}]}>
          {getActionDescription(item.action)}
        </Text>
        <Text style={[styles.activityTimestamp, {color: colors.text.tertiary}]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      <View style={styles.activityEarnings}>
        <Text style={[styles.earningsAmount, {color: colors.primary}]}>
          +${item.earnings.toFixed(2)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'completed' ? '#96CEB4' : '#FFEAA7',
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              {color: item.status === 'completed' ? '#2D7D32' : '#F57F17'},
            ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenTransition animationType="slide">
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Referrals"/>

        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View>
              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                  {renderStatCard(
                    'Total Referrals',
                    stats.totalReferrals.toString(),
                  )}
                  {renderStatCard(
                    'Total Earnings',
                    `$${stats.totalEarnings.toFixed(2)}`,
                  )}
                </View>
                <View style={styles.statsRow}>
                  {renderStatCard(
                    'This Month',
                    stats.thisMonthReferrals.toString(),
                    'referrals',
                  )}
                  {renderStatCard(
                    'Month Earnings',
                    `$${stats.thisMonthEarnings.toFixed(2)}`,
                  )}
                </View>
              </View>

              {/* Pending Earnings */}
              {stats.pendingEarnings > 0 && (
                <View
                  style={[
                    styles.pendingContainer,
                    {backgroundColor: colors.surface},
                  ]}>
                  <View style={styles.pendingContent}>
                    <Icon name="clock" size={20} color="#FFEAA7" />
                    <Text
                      style={[styles.pendingText, {color: colors.text.primary}]}>
                      ${stats.pendingEarnings.toFixed(2)} pending
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.pendingSubtext,
                      {color: colors.text.secondary},
                    ]}>
                    Will be processed within 24-48 hours
                  </Text>
                </View>
              )}

              {/* Referral Code Section */}
              <View
                style={[
                  styles.referralSection,
                  {backgroundColor: colors.surface},
                ]}>
                <View style={styles.referralHeader}>
                  <Icon name="gift" size={24} color={colors.primary} />
                  <Text
                    style={[styles.referralTitle, {color: colors.text.primary}]}>
                    Invite Friends & Earn
                  </Text>
                </View>

                <Text
                  style={[
                    styles.referralDescription,
                    {color: colors.text.secondary},
                  ]}>
                  Share your referral code and earn $2 for each friend who joins,
                  plus 10% of their earnings!
                </Text>

                <View
                  style={[
                    styles.codeContainer,
                    {backgroundColor: colors.background},
                  ]}>
                  <Text
                    style={[styles.codeLabel, {color: colors.text.secondary}]}>
                    Your Referral Code
                  </Text>
                  <View style={styles.codeRow}>
                    <Text style={[styles.codeText, {color: colors.primary}]}>
                      ADTIP123
                    </Text>
                    <TouchableOpacity
                      onPress={copyReferralCode}
                      style={styles.copyButton}>
                      <Icon name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.shareButton,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={handleShare}>
                    <Icon name="share-2" size={18} color={colors.white} />
                    <Text style={[styles.shareButtonText, {color: colors.white}]}>
                      Share Code
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.linkButton, {borderColor: colors.primary}]}
                    onPress={copyReferralLink}>
                    <Icon name="link" size={18} color={colors.primary} />
                    <Text
                      style={[styles.linkButtonText, {color: colors.primary}]}>
                      Copy Link
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Activity Header */}
              <View style={styles.activityHeader}>
                <Text
                  style={[styles.activityTitle, {color: colors.text.primary}]}>
                  Referral Activity
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            !isLoading && activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="users" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyText, {color: colors.text.secondary}]}>
                  No referral activity yet
                </Text>
                <Text
                  style={[styles.emptySubtext, {color: colors.text.tertiary}]}>
                  Share your referral code to start earning
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  pendingContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingSubtext: {
    fontSize: 14,
  },
  referralSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  referralDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  codeContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activityHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityTimestamp: {
    fontSize: 12,
  },
  activityEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ReferralScreen;
