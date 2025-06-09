// src/components/common/Header.tsx
import React, {useState, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform, TextInput, Keyboard} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../contexts/ThemeContext';
import {useWallet} from '../../contexts/WalletContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  // showBackButton?: boolean; // This is currently not used as per previous changes
  showLogo?: boolean; // Controls logo visibility, defaults based on context
  showWallet?: boolean;
  showNotifications?: boolean;
  // walletAmount?: string; // Amount display was removed previously
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  centerComponent?: React.ReactNode; // Will be overridden by search if active
  rightIcon?: string;
  onRightIconPress?: () => void;
  showTipShortsIcon?: boolean;
  onSearchSubmit?: (query: string) => void;
}

// Utility to help decide default logo visibility (can be adjusted or removed if prop is always explicit)
function isScreenHeader(): boolean {
  return true; // Assuming header is mostly used in screens where logo might be hidden by default
}

const Header: React.FC<HeaderProps> = ({
  title,
  showLogo, // Explicit prop from screen takes precedence
  showWallet = true,
  showNotifications = true,
  // walletAmount, // Removed
  leftComponent,
  rightComponent,
  centerComponent,
  rightIcon,
  onRightIconPress,
  showTipShortsIcon,
  onSearchSubmit,
}) => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {balance} = useWallet(); // Assuming balance is still needed for other logic if any
  const {toggleSidebar} = useSidebar();
  const {width: screenWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets(); // For potential future use, not directly for padding here if SafeAreaView is at root
  const searchInputRef = useRef<TextInput>(null);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if logo should be shown. Default to false for screens if not specified.
  const defaultShowLogo = !isScreenHeader(); // Example: show logo by default if not a "screen" context
  const actualShowLogo = typeof showLogo === 'boolean' ? showLogo : defaultShowLogo;

  const shouldShowTipShortsIconProp = !!showTipShortsIcon;

  // const displayAmount = (walletAmount || balance || '0.00').toString(); // Not displayed

  const navigateToWallet = () => navigation.navigate('Wallet' as never);
  const navigateToNotifications = () => navigation.navigate('Notifications' as never);
  const navigateToTipShorts = () => navigation.navigate('TipShorts' as never);

  const handleSearchIconPress = () => {
    setIsSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleCloseSearch = () => {
    Keyboard.dismiss();
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const handleSearchQueryChange = (text: string) => setSearchQuery(text);

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    if (searchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    }
    // Optionally keep search active: setIsSearchActive(false); setSearchQuery('');
  };

  const sizes = getResponsiveSizes(screenWidth);

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingHorizontal: sizes.paddingHorizontal,
          borderBottomColor: colors.borderLight,
        }
      ]}
    >
      {/* --- LEFT SECTION --- */}
      <View style={[styles.leftSection, { marginRight: sizes.iconSpacing / 2 }]}>
        {leftComponent ? leftComponent : (
          <>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Icon name="menu" size={sizes.menuIconSize} color={colors.text.primary} />
            </TouchableOpacity>
            {actualShowLogo && (
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../../assets/images/logo.png')} 
                  style={[styles.logoImage, {width: sizes.menuIconSize + 4, height: sizes.menuIconSize + 4}]}
                  resizeMode="contain"
                />
              </View>
            )}
            {/* Show title in left section if no centerComponent is active and search is not active OR if title is short */}
            {title && !centerComponent && (
              <Text 
                numberOfLines={1} 
                ellipsizeMode="tail"
                style={[styles.title, {color: colors.text.primary, fontSize: sizes.titleSize, marginLeft: actualShowLogo ? sizes.iconSpacing / 2 : 0 }]}>
                {title}
              </Text>
            )}
          </>
        )}
      </View>

      {/* --- CENTER SECTION: Search Input OR Original Center Component --- */}
      <View style={[styles.centerSectionContainer, { marginHorizontal: sizes.iconSpacing / 2 }]}>
        {isSearchActive ? (
          <>
            <TextInput
              ref={searchInputRef}
              style={[
                styles.searchInput, 
                {
                  color: colors.text.primary, 
                  borderColor: colors.border, 
                  backgroundColor: colors.inputBackground, // Use theme color for input background
                  fontSize: sizes.titleSize > 16 ? sizes.titleSize - 2 : sizes.titleSize, // Slightly smaller font for input
                }
              ]}
              placeholder="Search Adtip..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearIcon}>
                <Icon name="x" size={sizes.iconSize * 0.8} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </>
        ) : centerComponent ? (
          <View style={styles.centerComponent}>{centerComponent}</View>
        ) : (
          // This view ensures the center section takes up space if no specific center content
          <View style={{flex: 1}} /> 
        )}
      </View>

      {/* --- RIGHT SECTION --- */}
      <View style={styles.rightSection}>
        {rightComponent ? rightComponent : (
          <>
            {/* Custom Right Icon (e.g., refresh) - appears before search/close */}
            {rightIcon && onRightIconPress && (
              <TouchableOpacity
                onPress={onRightIconPress}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}> {/* Adjusted spacing */}
                <Icon name={rightIcon} size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}

            {shouldShowTipShortsIconProp && (
              <TouchableOpacity
                onPress={navigateToTipShorts}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}> {/* Adjusted spacing */}
                <Icon name="play-circle" size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}

            {/* Search Icon / Close Search Icon */}
            {isSearchActive ? (
              <TouchableOpacity onPress={handleCloseSearch} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}> {/* Adjusted spacing */}
                <Icon name="x" size={sizes.iconSize} color={colors.text.primary} /> {/* Changed to primary for better visibility as a close button */}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSearchIconPress} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}> {/* Adjusted spacing */}
                <Icon name="search" size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            
            {showNotifications && (
              <TouchableOpacity
                onPress={navigateToNotifications}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}> {/* Adjusted spacing */}
                <Icon name="bell" size={sizes.iconSize} color={colors.text.secondary} />
                <View
                  style={[
                    styles.notificationBadge,
                    {
                      backgroundColor: colors.primary,
                      width: sizes.iconSize * 0.3, height: sizes.iconSize * 0.3,
                      borderRadius: sizes.iconSize * 0.15,
                      top: sizes.iconSize * 0.3, right: sizes.iconSize * 0.3,
                    },
                  ]}
                />
              </TouchableOpacity>
            )}
            
            {showWallet && ( // Simplified wallet icon display (amount was already removed)
              <TouchableOpacity
                onPress={navigateToWallet}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}> {/* Adjusted spacing */}
                <Icon name="credit-card" size={sizes.iconSize} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const getResponsiveSizes = (screenWidth: number) => {
  if (screenWidth < 360) {
    return {
      iconSize: 18, menuIconSize: 22, paddingHorizontal: 8, iconSpacing: 6,
      titleSize: 15, walletFontSize: 12, walletIconSize: 12, maxWalletWidth: 50,
    };
  } else if (screenWidth < 480) {
    return {
      iconSize: 20, menuIconSize: 24, paddingHorizontal: 12, iconSpacing: 10,
      titleSize: 16, walletFontSize: 13, walletIconSize: 14, maxWalletWidth: 60,
    };
  } else {
    return {
      iconSize: 22, menuIconSize: 26, paddingHorizontal: 16, iconSpacing: 14,
      titleSize: 18, walletFontSize: 14, walletIconSize: 16, maxWalletWidth: 80,
    };
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, // Use hairlineWidth for a thinner border
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    // flexShrink: 1, // Allow shrinking if title is long
    // marginRight: sizes.iconSpacing / 2, // Moved to inline style in JSX
  },
  centerSectionContainer: {
    flex: 1, // This is crucial for the search bar to take available space
    flexDirection: 'row',
    alignItems: 'center',
    // marginHorizontal: sizes.iconSpacing / 2, // Moved to inline style in JSX
  },
  centerComponent: { // For the original centerComponent prop
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginLeft: sizes.iconSpacing / 2, // Default from getResponsiveSizes might be too large
  },
  menuButton: {
    padding: 4,
    marginRight: 8, // Space after menu icon
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginRight: 6, // Space after logo if title follows
  },
  logoImage: {
    resizeMode: 'contain',
  },
  title: {
    fontWeight: 'bold',
    // marginLeft: actualShowLogo ? sizes.iconSpacing / 2 : 0, // Handled in JSX
    flexShrink: 1, // Allow title to shrink if needed
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
  },
  // walletButton and walletIcon styles are not strictly needed if it's just an iconButton now
  
  // Styles for inline search (within centerSectionContainer)
  searchInput: {
    flex: 1,
    height: 36, // Consistent height for the input bar
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4, // Adjust vertical padding for centering text
    borderRadius: 18, // Rounded edges
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchClearIcon: {
    paddingLeft: 6, // Padding to the left of the 'x' icon
    paddingRight: 2, // Minimal padding to the right
    height: 36, // Match input height
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;