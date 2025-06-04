// src/components/common/Header.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../contexts/ThemeContext';
import {useWallet} from '../../contexts/WalletContext';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showWallet?: boolean;
  showNotifications?: boolean;
  walletAmount?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showLogo = true,
  showWallet = true,
  showNotifications = true,
  walletAmount,
  leftComponent,
  rightComponent,
  centerComponent,
}) => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {balance} = useWallet();

  // Use the wallet balance from context if no walletAmount is explicitly provided
  // Ensure it's a string to avoid the "Text strings must be rendered within a <Text> component" warning
  const displayAmount = (walletAmount || balance || '0.00').toString();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const navigateToWallet = () => {
    navigation.navigate('Wallet' as never);
  };

  const navigateToNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  const navigateToSearch = () => {
    navigation.navigate('Search' as never);
  };
  
  // Add navigation to TipShorts
  const navigateToTipShorts = () => {
    navigation.navigate('TipShorts' as never);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.leftSection}>
        {leftComponent ? (
          leftComponent
        ) : showBackButton ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
        {showLogo && !centerComponent && (
          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, {color: colors.primary}]}>Adtip</Text>
          </View>
        )}
        {title && !centerComponent && (
          <Text style={[styles.title, {color: colors.text.primary}]}>{title}</Text>
        )}
        {centerComponent && (
          <View style={styles.centerComponent}>{centerComponent}</View>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightComponent ? (
          rightComponent
        ) : (
          <>
            {/* Add TipShorts icon button */}
            <TouchableOpacity
              onPress={navigateToTipShorts}
              style={styles.iconButton}>
              <Icon name="play-circle" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={navigateToSearch}
              style={styles.iconButton}>
              <Icon name="search" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
            
            {showNotifications && (
              <TouchableOpacity
                onPress={navigateToNotifications}
                style={styles.iconButton}>
                <Icon name="bell" size={22} color={colors.text.secondary} />
                <View
                  style={[
                    styles.notificationBadge,
                    {backgroundColor: colors.primary},
                  ]}
                />
              </TouchableOpacity>
            )}
            
            {showWallet && (
              <TouchableOpacity
                onPress={navigateToWallet}
                style={[
                  styles.walletButton,
                  {borderColor: colors.borderLight},
                ]}>
                <Icon
                  name="credit-card"
                  size={16}
                  color={colors.primary}
                  style={styles.walletIcon}
                />
                <Text
                  style={[styles.walletAmount, {color: colors.text.primary}]}
                >
                  ₹{displayAmount || '0.00'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '20%',
  },
  centerComponent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: '20%',
  },
  backButton: {
    marginRight: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
    marginLeft: 16,
    position: 'relative',
  },
  notificationBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 16,
  },
  walletIcon: {
    marginRight: 4,
  },
  walletAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Header;