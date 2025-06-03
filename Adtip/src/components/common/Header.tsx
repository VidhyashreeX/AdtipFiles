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
  walletAmount?: string; // This prop can override the context balance
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
  walletAmount, // Prop for overriding wallet balance
  leftComponent,
  rightComponent,
  centerComponent,
}) => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {balance} = useWallet(); // Get balance from WalletContext

  // Use the walletAmount prop if provided, otherwise use balance from context, default to '0.00'
  // Ensure the value is always a string before rendering in <Text>
  const displayAmount = (walletAmount ?? balance ?? '0.00').toString();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const navigateToWallet = () => {
    navigation.navigate('Wallet' as never); // Type assertion for navigation
  };

  const navigateToNotifications = () => {
    navigation.navigate('Notifications' as never); // Type assertion for navigation
  };

  const navigateToSearch = () => {
    navigation.navigate('Search' as never); // Type assertion for navigation
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background, borderBottomColor: colors.border}]}>
      <View style={styles.leftSection}>
        {leftComponent ? (
          // If a custom left component is provided, render it directly
          leftComponent
        ) : showBackButton ? (
          // Otherwise, show a back button if enabled
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
        {/* Only show logo if not using a custom center component and showLogo is true */}
        {showLogo && !centerComponent && (
          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, {color: colors.primary}]}>
              Adtip
            </Text>
          </View>
        )}
        {/* Only show title if not using a custom center component and title is provided */}
        {title && !centerComponent && (
          <Text style={[styles.title, {color: colors.text.primary}]} numberOfLines={1} ellipsizeMode="tail">
            {/* Ensure title is converted to string for Text component */}
            {String(title)}
          </Text>
        )}
        {/* Render custom center component if provided */}
        {centerComponent && (
          <View style={styles.centerComponent}>{centerComponent}</View>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightComponent ? (
          // If a custom right component is provided, render it directly
          rightComponent
        ) : (
          // Otherwise, show default right icons/wallet if no custom component
          <>
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
                {/* Notification badge, ensure it's not holding raw text */}
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
                  // Use colors.border for consistency
                  {borderColor: colors.border},
                ]}>
                <Icon
                  name="credit-card"
                  size={16}
                  color={colors.primary}
                  style={styles.walletIcon}
                />
                <Text
                  style={[styles.walletAmount, {color: colors.text.primary}]}
                  numberOfLines={1} // Added to handle long amounts gracefully
                  ellipsizeMode="tail" // Added for consistency with title
                >
                  {/* Ensure displayAmount is prefixed with currency and converted to string */}
                  {`₹${displayAmount}`}
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
    // The borderBottomColor will now come from `colors.border` passed inline
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '20%', // Added to give some consistent width
  },
  centerComponent: {
    flex: 1, // Allows center component to take available space
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: '20%', // Added to give some consistent width
  },
  backButton: {
    marginRight: 16,
    padding: 4, // Added a little padding for easier touch
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // logoImage: { // Removed as it's not used
  //   width: 30,
  //   height: 30,
  //   borderRadius: 15,
  //   marginRight: 8,
  // },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8, // Added a small margin for separation from back button/logo
    flexShrink: 1, // Allows text to shrink if it's too long
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
