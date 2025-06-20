import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../contexts/WalletContext';

const GlobalWalletBar = () => {
  const { colors, isDarkMode } = useTheme();
  const { balance, isLoading } = useWallet();
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.surface : '#fff',
          borderColor: isDarkMode ? colors.primary : colors.secondary,
        },
      ]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Wallet')}
    >
      <Text style={[styles.amount, { color: isDarkMode ? colors.text.primary : colors.primary }]}>₹{isLoading ? '...' : balance}</Text>
      <Icon name="credit-card" size={22} color={colors.primary} style={{ marginLeft: 10 }} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    marginTop: 10,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default GlobalWalletBar; 