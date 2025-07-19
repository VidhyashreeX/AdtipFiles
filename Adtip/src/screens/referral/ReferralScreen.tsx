import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';
import WithdrawalForm from '../../components/withdrawal/WithdrawalForm';
import ApiService from '../../services/ApiService';
import PremiumPopup from '../../components/common/PremiumPopup';

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



const ReferralScreen: React.FC = () => {
  const {colors} = useTheme();
  const {user, premiumState} = useAuth();
  const isPremium = premiumState.isPremium;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isReferralWithdrawalModalVisible, setIsReferralWithdrawalModalVisible] = useState(false);
  const [isCouponWithdrawalModalVisible, setIsCouponWithdrawalModalVisible] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user?.id]);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.get(`/api/referral/details/${user?.id}`);
      console.log('Referral API Response:', response);
      if (response.status === true) {
        setReferralData(response.data);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleShareApp = async () => {
    try {
      const appUrl = 'https://adtip.app/download';
      const message = `Check out Adtip - the best app to earn money by watching videos and creating content! Download now and start earning:\n\n${appUrl}`;

      await Share.share({
        message,
        url: appUrl,
        title: 'Download Adtip - Earn Money Watching Videos!',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
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
    const minimumAmount = isPremium ? 1000 : 5000;

    if (referralData.available_referral_balance < minimumAmount) {
      Alert.alert(
        'Insufficient Balance',
        `Minimum withdrawal amount is ₹${minimumAmount} for ${isPremium ? 'premium' : 'regular'} users.${!isPremium ? ' Upgrade to premium for ₹1,000 minimum.' : ''}`
      );
      return;
    }
    setIsReferralWithdrawalModalVisible(true);
  };

  const handleCouponWithdraw = () => {
    const minimumAmount = isPremium ? 1000 : 5000;

    if (referralData.available_coupon_balance < minimumAmount) {
      Alert.alert(
        'Insufficient Balance',
        `Minimum withdrawal amount is ₹${minimumAmount} for ${isPremium ? 'premium' : 'regular'} users.${!isPremium ? ' Upgrade to premium for ₹1,000 minimum.' : ''}`
      );
      return;
    }
    setIsCouponWithdrawalModalVisible(true);
  };

  const handleWithdrawalSuccess = () => {
    // Refresh referral data after successful withdrawal
    loadReferralData();
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



  return (
    <ScreenTransition animationType="slide">
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Referrals"/>

        <ScrollView
          showsVerticalScrollIndicator={false}>
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
              <View
                style={[
                  styles.withdrawContainer,
                  {backgroundColor: colors.surface},
                ]}>
                <TouchableOpacity
                  style={[styles.fullWidthWithdrawButton, {backgroundColor: colors.primary}]}
                  onPress={handleReferralWithdraw}>
                  <Icon name="credit-card" size={20} color={colors.white} />
                  <Text style={[styles.fullWidthWithdrawButtonText, {color: colors.white}]}>
                    Withdraw Referral Earnings (₹{referralData.available_referral_balance.toFixed(2)})
                  </Text>
                </TouchableOpacity>

                {/* Withdrawal Info */}
                <View style={[styles.withdrawalInfo, {backgroundColor: isPremium ? '#D4EDDA' : '#FFF3CD'}]}>
                  <Icon
                    name="info"
                    size={16}
                    color={isPremium ? '#155724' : '#856404'}
                  />
                  <Text style={[styles.withdrawalInfoText, {color: isPremium ? '#155724' : '#856404'}]}>
                    Minimum withdrawal: ₹{isPremium ? '1,000' : '5,000'} ({isPremium ? 'Premium' : 'Regular'} user)
                    {!isPremium && '\nUpgrade to premium for ₹1,000 minimum'}
                  </Text>
                </View>
              </View>

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
              <View
                style={[
                  styles.withdrawContainer,
                  {backgroundColor: colors.surface},
                ]}>
                <TouchableOpacity
                  style={[styles.fullWidthWithdrawButton, {backgroundColor: colors.primary}]}
                  onPress={handleCouponWithdraw}>
                  <Icon name="credit-card" size={20} color={colors.white} />
                  <Text style={[styles.fullWidthWithdrawButtonText, {color: colors.white}]}>
                    Withdraw Coupon Earnings (₹{referralData.available_coupon_balance.toFixed(2)})
                  </Text>
                </TouchableOpacity>

                {/* Withdrawal Info */}
                <View style={[styles.withdrawalInfo, {backgroundColor: isPremium ? '#D4EDDA' : '#FFF3CD'}]}>
                  <Icon
                    name="info"
                    size={16}
                    color={isPremium ? '#155724' : '#856404'}
                  />
                  <Text style={[styles.withdrawalInfoText, {color: isPremium ? '#155724' : '#856404'}]}>
                    Minimum withdrawal: ₹{isPremium ? '1,000' : '5,000'} ({isPremium ? 'Premium' : 'Regular'} user)
                    {!isPremium && '\nUpgrade to premium for ₹1,000 minimum'}
                  </Text>
                </View>
              </View>

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

              {/* Share App Section */}
              <View
                style={[
                  styles.referralSection,
                  {backgroundColor: colors.surface},
                ]}>
                <View style={styles.referralHeader}>
                  <Icon name="smartphone" size={24} color={colors.primary} />
                  <Text
                    style={[styles.referralTitle, {color: colors.text.primary}]}>
                    Share Adtip App
                  </Text>
                </View>

                <Text
                  style={[
                    styles.referralDescription,
                    {color: colors.text.secondary},
                  ]}>
                  Help others discover Adtip and start earning money by watching videos and creating content!
                </Text>

                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    {backgroundColor: colors.success || colors.primary},
                  ]}
                  onPress={handleShareApp}>
                  <Icon name="download" size={18} color={colors.white} />
                  <Text style={[styles.shareButtonText, {color: colors.white}]}>
                    Share App
                  </Text>
                </TouchableOpacity>
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

            </View>
          </ScrollView>
      </SafeAreaView>

      {/* Referral Withdrawal Form Modal */}
      <WithdrawalForm
        visible={isReferralWithdrawalModalVisible}
        onClose={() => setIsReferralWithdrawalModalVisible(false)}
        onSuccess={handleWithdrawalSuccess}
        withdrawalType="referral"
        availableBalance={referralData.available_referral_balance}
        userId={user?.id || 0}
      />

      {/* Coupon Withdrawal Form Modal */}
      <WithdrawalForm
        visible={isCouponWithdrawalModalVisible}
        onClose={() => setIsCouponWithdrawalModalVisible(false)}
        onSuccess={handleWithdrawalSuccess}
        withdrawalType="coupon"
        availableBalance={referralData.available_coupon_balance}
        userId={user?.id || 0}
      />

      <PremiumPopup
        visible={showPremiumPopup}
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => setShowPremiumPopup(false)}
      />
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
  fullWidthWithdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  fullWidthWithdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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

  backButton: {
    padding: 8,
    marginRight: 8,
  },

  withdrawalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  withdrawalInfoText: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});

export default ReferralScreen;
