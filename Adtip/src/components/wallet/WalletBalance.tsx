// src/components/wallet/WalletBalance.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

import useWallet from '../../hooks/useWallet';
import {useTheme} from '../../contexts/ThemeContext';

interface WalletBalanceProps {
  showRefresh?: boolean;
  compact?: boolean;
  onPress?: () => void;
  style?: any;
}

/**
 * A reusable component to display wallet balance
 */
const WalletBalance = ({
  showRefresh = false,
  compact = false,
  onPress,
  style,
}: WalletBalanceProps) => {
  const {balance, isLoading, refreshWallet, isPremium} = useWallet();
  const {colors} = useTheme();
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to wallet screen if no custom onPress is provided
      navigation.navigate('Wallet' as never);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.compactContainer,
          {backgroundColor: colors.card},
          style,
        ]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.compactContent}>
            <Icon
              name="wallet"
              size={16}
              color={colors.primary}
              style={styles.icon}
            />
            <Text style={[styles.compactBalance, {color: colors.text.primary}]}>
              ₹{String(balance)}{' '}
            </Text>
            {isPremium ? (
              <Icon
                name="star"
                size={12}
                color="#FFD700"
                style={styles.premiumIcon}
              />
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, {backgroundColor: colors.card}, style]}>
      <View style={styles.balanceRow}>
        <View>
          <Text style={[styles.label, {color: colors.text.secondary}]}>
            Wallet Balance
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.balanceContainer}>
              <Text style={[styles.balance, {color: colors.text.primary}]}>
                ₹{String(balance)}
              </Text>{' '}
              {isPremium ? (
                <Icon
                  name="star"
                  size={16}
                  color="#FFD700"
                  style={styles.premiumIcon}
                />
              ) : null}
            </View>
          )}
        </View>
        {showRefresh ? (
          <TouchableOpacity
            onPress={refreshWallet}
            style={styles.refreshButton}>
            <Icon name="refresh-cw" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  compactContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  compactBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  premiumIcon: {
    marginLeft: 4,
  },
});

export default WalletBalance;
