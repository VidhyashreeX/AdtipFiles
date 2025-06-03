// src/screens/wallet/WalletScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Components
import Header from '../../components/common/Header';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import RewardService from '../../services/RewardService';
import useWallet from '../../hooks/useWallet';

const WalletScreen = () => {
  const {colors} = useTheme();
  // Use our wallet hook instead of managing state manually
  const {balance, isLoading, isRefreshing, refreshWallet} = useWallet();
  const [offerwallLoading, setOfferwallLoading] = useState(false);

  // Show offerwall to earn coins
  const handleShowOfferwall = async () => {
    try {
      setOfferwallLoading(true);

      // Commented out PubScale integration - June 2, 2025
      // Show the PubScale offerwall
      await RewardService.showOfferwall();

      // Refresh wallet data after offerwall closes
      refreshWallet();
    } catch (error) {
      console.error('Error showing offerwall:', error);
      Alert.alert('Error', 'Failed to open offerwall. Please try again later.');
    } finally {
      setOfferwallLoading(false);
    }
  };

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Wallet" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text.primary}]}>
            Loading wallet data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Wallet" showBackButton />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshWallet}
            colors={[colors.primary]}
          />
        }>
        {/* Balance Card */}
        <View style={[styles.balanceCard, {backgroundColor: colors.card}]}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>₹{balance}</Text>
        </View>

        {/* Earn More Coins Button */}
        <TouchableOpacity
          style={[styles.earnButton, {backgroundColor: colors.primary}]}
          onPress={handleShowOfferwall}
          disabled={offerwallLoading}>
          {offerwallLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon
                name="gift"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.earnButtonText}>Earn More Coins</Text>
            </>
          )}
        </TouchableOpacity>
        {/* Removed Transactions List and related UI */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  contentContainer: {
    padding: 16,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'normal',
  },
  balanceInfo: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  earnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  earnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletScreen;
