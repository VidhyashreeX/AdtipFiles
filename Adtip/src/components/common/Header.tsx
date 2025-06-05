// src/components/common/Header.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../contexts/ThemeContext';
import {useWallet} from '../../contexts/WalletContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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
}) => {  const navigation = useNavigation();
  const {colors} = useTheme();
  const {balance} = useWallet();
  const {toggleSidebar} = useSidebar();
  const {width: screenWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets();

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
  };  // Calculate dynamic sizes based on screen width
  const getResponsiveSizes = () => {
    // Small screens (phones)
    if (screenWidth < 360) {
      return {
        iconSize: 18,
        menuIconSize: 22,
        paddingHorizontal: 8,
        iconSpacing: 6,
        titleSize: 15,
        walletFontSize: 12,
        walletIconSize: 12,
        maxWalletWidth: 50,
      };
    }
    // Medium screens (larger phones)
    else if (screenWidth < 480) {
      return {
        iconSize: 20,
        menuIconSize: 24,
        paddingHorizontal: 12,
        iconSpacing: 10,
        titleSize: 16,
        walletFontSize: 13,
        walletIconSize: 14,
        maxWalletWidth: 60,
      };
    }
    // Large screens (tablets)
    else {
      return {
        iconSize: 22,
        menuIconSize: 26,
        paddingHorizontal: 16,
        iconSpacing: 14,
        titleSize: 18,
        walletFontSize: 14,
        walletIconSize: 16,
        maxWalletWidth: 80,
      };
    }
  };

  const sizes = getResponsiveSizes();
  return (    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingHorizontal: sizes.paddingHorizontal,
          borderBottomColor: colors.borderLight,
          // No need for paddingTop as the parent view in App.tsx handles safe area
        }
      ]}
    >
      <View style={styles.leftSection}>
        {leftComponent ? (
          leftComponent
        ) : (
          <>
            {/* Hamburger Menu Icon */}
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Icon name="menu" size={sizes.menuIconSize} color={colors.text.primary} />
            </TouchableOpacity>
            
            {/* Show back button if needed */}
            {showBackButton && (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Icon name="arrow-left" size={sizes.menuIconSize} color={colors.text.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
        {showLogo && !centerComponent && (
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={[styles.logoImage, {width: sizes.menuIconSize + 4, height: sizes.menuIconSize + 4}]}
              resizeMode="contain"
            />
          </View>
        )}
        {title && !centerComponent && (
          <Text 
            numberOfLines={1}
            style={[
              styles.title, 
              {
                color: colors.text.primary,
                fontSize: sizes.titleSize
              }
            ]}
          >
            {title}
          </Text>
        )}
        {centerComponent && (
          <View style={styles.centerComponent}>{centerComponent}</View>
        )}
      </View>      <View style={styles.rightSection}>
        {rightComponent ? (
          rightComponent
        ) : (
          <>            {/* Add TipShorts icon button */}
            <TouchableOpacity
              onPress={navigateToTipShorts}
              style={[styles.iconButton, {marginLeft: sizes.iconSpacing}]}>
              <Icon name="play-circle" size={sizes.iconSize} color={colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={navigateToSearch}
              style={[styles.iconButton, {marginLeft: sizes.iconSpacing}]}>
              <Icon name="search" size={sizes.iconSize} color={colors.text.secondary} />
            </TouchableOpacity>
            
            {showNotifications && (
              <TouchableOpacity
                onPress={navigateToNotifications}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing}]}>
                <Icon name="bell" size={sizes.iconSize} color={colors.text.secondary} />
                <View
                  style={[
                    styles.notificationBadge,
                    {
                      backgroundColor: colors.primary,
                      width: sizes.iconSize * 0.3,
                      height: sizes.iconSize * 0.3,
                      borderRadius: sizes.iconSize * 0.15,
                      top: sizes.iconSize * 0.3,
                      right: sizes.iconSize * 0.3,
                    },
                  ]}
                />
              </TouchableOpacity>
            )}
            
            {showWallet && screenWidth > 320 && (
              <TouchableOpacity
                onPress={navigateToWallet}
                style={[
                  styles.walletButton,
                  {
                    borderColor: colors.borderLight,
                    paddingHorizontal: sizes.iconSpacing - 2,
                    paddingVertical: 3,
                    marginLeft: sizes.iconSpacing,
                    borderRadius: 16,
                  },
                ]}>
                <Icon
                  name="credit-card"
                  size={sizes.walletIconSize}
                  color={colors.primary}
                  style={styles.walletIcon}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.walletAmount, 
                    {
                      color: colors.text.primary,
                      fontSize: sizes.walletFontSize,
                      maxWidth: sizes.maxWalletWidth
                    }
                  ]}
                >
                  ₹{displayAmount || '0.00'}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* For very small screens, show only wallet icon without amount */}
            {showWallet && screenWidth <= 320 && (
              <TouchableOpacity
                onPress={navigateToWallet}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing}]}>
                <Icon name="credit-card" size={sizes.iconSize} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    // borderBottomColor handled in style prop for dark mode compatibility
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    flexShrink: 0,
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  backButton: {
    marginRight: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    marginRight: 6,
    resizeMode: 'contain',
  },
  logoText: {
    fontWeight: 'bold',
  },
  title: {
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 4,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  walletIcon: {
    marginRight: 3,
  },
  walletAmount: {
    fontWeight: '600',
  },
});

export default Header;