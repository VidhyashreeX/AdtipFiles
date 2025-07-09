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
import {useNavigation} from '@react-navigation/native';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';

interface ReferralData {
  referral_code: string;
  total_referrals: number;
  total_referrals_earnings: number;
  total_referral_withdrawals_amount: number;
  available_referral_balance: number;
  each_referral: number;
  total_premiums: number;
  total_premium_earnings: number;
  total_coupon_withdrawals_amount: number;
  available_coupon_balance: number;
  coupon_code: string;
  each_coupon: number;
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
  const navigation = useNavigation();
  const [referralData, setReferralData] = useState<ReferralData>({
    referral_code: '',
    total_referrals: 0,
    total_referrals_earnings: 0,
    total_referral_withdrawals_amount: 0,
    available_referral_balance: 0,
    each_referral: 0,
    total_premiums: 0,
    total_premium_earnings: 0,
    total_coupon_withdrawals_amount: 0,
    available_coupon_balance: 0,
    coupon_code: '',
    each_coupon: 0,
  });
  const [activities, setActivities] = useState<ReferralActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = () => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/referral/details/:userid');
    // const data = await response.json();
    
    // Simulate API call with the new data structure
    setTimeout(() => {
      const mockData: ReferralData = {
        referral_code: "ADTIP508167A",
        total_referrals: 0,
        total_referrals_earnings: 0,
        total_referral_withdrawals_amount: 0,
        available_referral_balance: 0,
        each_referral: 3,
        total_premiums: 0,
        total_premium_earnings: 0,
        total_coupon_withdrawals_amount: 0,
        available_coupon_balance: 0,
        coupon_code: "SAVE50816897W50",
        each_coupon: 30,
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
      ];

      setReferralData(mockData);
      setActivities(mockActivities);
      setIsLoading(false);
    }, 1000);
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://adtip.app/invite/${referralData.referral_code}`;
      const message = `Join me on Adtip and earn money watching videos and creating content! Use my referral code: ${referralData.referral_code}\n\n${shareUrl}`;

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
    Clipboard.setString(referralData.referral_code);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const copyReferralLink = () => {
    const shareUrl = `https://adtip.app/invite/${referralData.referral_code}`;
    Clipboard.setString(shareUrl);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
  };

  const copyCouponCode = () => {
    Clipboard.setString(referralData.coupon_code);
    Alert.alert('Copied!', 'Coupon code copied to clipboard');
  };

  const handleReferralWithdraw = () => {
    // TODO: Implement referral withdrawal API
    Alert.alert(
      'Withdraw Referral Earnings',
      `Withdraw ₹${referralData.available_referral_balance} from your referral earnings?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Withdraw', onPress: () => {
          Alert.alert('Success', 'Withdrawal request submitted successfully!');
        }},
      ]
    );
  };

  const handleCouponWithdraw = () => {
    // TODO: Implement coupon withdrawal API
    Alert.alert(
      'Withdraw Coupon Earnings',
      `Withdraw ₹${referralData.available_coupon_balance} from your coupon earnings?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Withdraw', onPress: () => {
          Alert.alert('Success', 'Withdrawal request submitted successfully!');
        }},
      ]
    );
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
      style={[styles.activityItem, {borderBottomColor: colors.borderLight}]}>
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
          +₹{item.earnings.toFixed(2)}
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
        <Header
          title="Referrals"
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

        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View>
              {/* Referral Stats */}
              <View style={styles.statsContainer}>
                <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
                  Referral Earnings
                </Text>
                <View style={styles.statsRow}>
                  {renderStatCard(
                    'Total Referrals',
                    referralData.total_referrals.toString(),
                  )}
                  {renderStatCard(
                    'Total Earnings',
                    `₹${referralData.total_referrals_earnings.toFixed(2)}`,
                  )}
                </View>
                <View style={styles.statsRow}>
                  {renderStatCard(
                    'Available Balance',
                    `₹${referralData.available_referral_balance.toFixed(2)}`,
                  )}
                  {renderStatCard(
                    'Per Referral',
                    `₹${referralData.each_referral}`,
                  )}
                </View>
              </View>

              {/* Referral Withdraw Section */}
              {referralData.available_referral_balance > 0 && (
                <View
                  style={[
                    styles.withdrawContainer,
                    {backgroundColor: colors.surface},
                  ]}>
                  <View style={styles.withdrawContent}>
                    <Icon name="credit-card" size={20} color="#4CAF50" />
                    <Text
                      style={[styles.withdrawText, {color: colors.text.primary}]}>
                      ₹{referralData.available_referral_balance.toFixed(2)} available to withdraw
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.withdrawButton, {backgroundColor: colors.primary}]}
                    onPress={handleReferralWithdraw}>
                    <Text style={[styles.withdrawButtonText, {color: colors.white}]}>
                      Withdraw
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Coupon Stats */}
              <View style={styles.statsContainer}>
                <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
                  Coupon Earnings
                </Text>
                <View style={styles.statsRow}>
                  {renderStatCard(
                    'Total Premiums',
                    referralData.total_premiums.toString(),
                  )}
                  {renderStatCard(
                    'Total Earnings',
                    `₹${referralData.total_premium_earnings.toFixed(2)}`,
                  )}
                </View>
                <View style={styles.statsRow}>
                  {renderStatCard(
                    'Available Balance',
                    `₹${referralData.available_coupon_balance.toFixed(2)}`,
                  )}
                  {renderStatCard(
                    'Per Coupon',
                    `₹${referralData.each_coupon}`,
                  )}
                </View>
              </View>

              {/* Coupon Withdraw Section */}
              {referralData.available_coupon_balance > 0 && (
                <View
                  style={[
                    styles.withdrawContainer,
                    {backgroundColor: colors.surface},
                  ]}>
                  <View style={styles.withdrawContent}>
                    <Icon name="credit-card" size={20} color="#4CAF50" />
                    <Text
                      style={[styles.withdrawText, {color: colors.text.primary}]}>
                      ₹{referralData.available_coupon_balance.toFixed(2)} available to withdraw
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.withdrawButton, {backgroundColor: colors.primary}]}
                    onPress={handleCouponWithdraw}>
                    <Text style={[styles.withdrawButtonText, {color: colors.white}]}>
                      Withdraw
                    </Text>
                  </TouchableOpacity>
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
                  Share your referral code and earn ₹{referralData.each_referral} for each friend who joins!
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
                      {referralData.referral_code}
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

              {/* Coupon Code Section */}
              <View
                style={[
                  styles.referralSection,
                  {backgroundColor: colors.surface},
                ]}>
                <View style={styles.referralHeader}>
                  <Icon name="tag" size={24} color={colors.primary} />
                  <Text
                    style={[styles.referralTitle, {color: colors.text.primary}]}>
                    Your Coupon Code
                  </Text>
                </View>

                <Text
                  style={[
                    styles.referralDescription,
                    {color: colors.text.secondary},
                  ]}>
                  Share your coupon code and earn ₹{referralData.each_coupon} when friends use it!
                </Text>

                <View
                  style={[
                    styles.codeContainer,
                    {backgroundColor: colors.background},
                  ]}>
                  <Text
                    style={[styles.codeLabel, {color: colors.text.secondary}]}>
                    Your Coupon Code
                  </Text>
                  <View style={styles.codeRow}>
                    <Text style={[styles.codeText, {color: colors.primary}]}>
                      {referralData.coupon_code}
                    </Text>
                    <TouchableOpacity
                      onPress={copyCouponCode}
                      style={styles.copyButton}>
                      <Icon name="copy" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={handleShare}>
                  <Icon name="share-2" size={18} color={colors.white} />
                  <Text style={[styles.shareButtonText, {color: colors.white}]}>
                    Share Coupon
                  </Text>
                </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
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
  withdrawContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  withdrawContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  withdrawButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default ReferralScreen;
