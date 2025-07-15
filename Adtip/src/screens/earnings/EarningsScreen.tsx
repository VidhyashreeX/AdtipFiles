import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { IndianRupee } from 'lucide-react-native';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import {useNavigation} from '@react-navigation/native';

const EarningsScreen: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const navigation = useNavigation();
  
  // Mock data
  const earningsData = {
    totalEarned: 1247.50,
    thisMonth: 183.25,
    progress: 7.5,
    progressTarget: 50
  };
  
  // Menu items
  const menuItems = [
    {
      id: 'payment_history',
      icon: 'calendar',
      title: 'Payment History',
      onPress: () => console.log('Navigate to Payment History'),
      iconBgColor: '#FFFAEB',
      iconColor: '#F6A723',
    },
    {
      id: 'withdrawal_methods',
      icon: 'credit-card',
      title: 'Withdrawal Methods',
      onPress: () => console.log('Navigate to Withdrawal Methods'),
      iconBgColor: '#F0F9FF',
      iconColor: '#0091FF',
    },
    {
      id: 'earning_goals',
      icon: 'target',
      title: 'Earning Goals',
      onPress: () => console.log('Navigate to Earning Goals'),
      iconBgColor: '#FEF6FB',
      iconColor: '#CB1C8D',
    },
    {
      id: 'bonus_rewards',
      icon: 'gift',
      title: 'Bonus Rewards',
      onPress: () => console.log('Navigate to Bonus Rewards'),
      iconBgColor: '#FFF5F5',
      iconColor: '#F87171',
      badge: '3 Available'
    },
  ];

  const renderMenuItem = (item: {
    id: string;
    icon: string;
    title: string;
    onPress: () => void;
    iconBgColor: string;
    iconColor: string;
    badge?: string;
  }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'},
      ]}
      onPress={item.onPress}>
      <View style={[styles.menuItemIconContainer, {backgroundColor: item.iconBgColor}]}>
        <Icon name={item.icon} size={22} color={item.iconColor} />
      </View>
      <Text style={[styles.menuItemText, {color: colors.text.primary}]}>
        {item.title}
      </Text>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );

  // Calculate progress percentage
  const progressPercentage = (earningsData.progress / earningsData.progressTarget) * 100;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Earnings"
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
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Earnings Card */}
        <View style={[styles.earningsCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
          <View style={styles.earningsHeader}>
            <LinearGradient
              colors={['#FF6B00', '#FF8A00']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.earningsIcon}>
              <IndianRupee size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.earningsTitle, {color: colors.text.primary}]}>Earnings</Text>
          </View>

          <View style={styles.earningsStats}>
            <View style={styles.totalEarnings}>
              <Text style={[styles.totalAmount, {color: colors.text.primary}]}>
                ${earningsData.totalEarned.toFixed(2)}
              </Text>
              <Text style={[styles.totalLabel, {color: colors.text.tertiary}]}>
                Total Earned
              </Text>
            </View>

            <View style={styles.monthlyEarnings}>
              <Text style={[styles.monthlyAmount, {color: '#10B981'}]}>
                ${earningsData.thisMonth.toFixed(2)}
              </Text>
              <Text style={[styles.monthlyLabel, {color: colors.text.tertiary}]}>
                This Month
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={[styles.progressText, {color: colors.text.tertiary}]}>
              Progress to next reward
            </Text>
            <Text style={[styles.progressAmount, {color: colors.text.secondary}]}>
              ${earningsData.progress.toFixed(2)} / ${earningsData.progressTarget.toFixed(2)}
            </Text>
            <View style={[styles.progressBarContainer, {backgroundColor: isDarkMode ? colors.border.light : '#F3F4F6'}]}>
              <View 
                style={[
                  styles.progressBar, 
                  {width: `${progressPercentage}%`, backgroundColor: '#10B981'}
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        {menuItems.map(renderMenuItem)}
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
    padding: 16,
  },
  earningsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalEarnings: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  monthlyEarnings: {
    alignItems: 'flex-end',
  },
  monthlyAmount: {
    fontSize: 22,
    fontWeight: '600',
  },
  monthlyLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default EarningsScreen;
