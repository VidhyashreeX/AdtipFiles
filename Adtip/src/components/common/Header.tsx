// src/components/common/Header.tsx
import React, {useState, useRef, useMemo, useCallback} from 'react'; // Add useMemo, useCallback
import {View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform, TextInput, Keyboard} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../contexts/ThemeContext';
import {useWallet} from '../../contexts/WalletContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export interface HeaderProps {
  title: string;
  showLogo?: boolean;
  showWallet?: boolean;
  walletAmount?: string;
  showNotifications?: boolean;
  leftComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  rightIcon?: string;
  onRightIconPress?: () => void;
  showTipShortsIcon?: boolean;
  onSearchSubmit?: (query: string) => void;
  onSearchQueryChange?: (query: string) => void; // <<< ADD NEW PROP
  showSearch?: boolean; 
}

// Utility to help decide default logo visibility
function isScreenHeader(): boolean {
  return true; 
}

const Header: React.FC<HeaderProps> = ({
  title,
  showLogo,
  showWallet = true,
  showNotifications = true,
  walletAmount,
  leftComponent,
  centerComponent,
  rightComponent,
  rightIcon,
  onRightIconPress,
  showTipShortsIcon,
  onSearchSubmit,
  onSearchQueryChange, // <<< GET NEW PROP
  showSearch = true,
}) => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {balance} = useWallet(); 
  const {toggleSidebar} = useSidebar();
  const {width: screenWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets(); 
  const searchInputRef = useRef<TextInput>(null);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQueryLocal, setSearchQueryLocal] = useState(''); // Renamed to avoid confusion with TipCallScreen's searchQuery

  // Memoize expensive calculations
  const sizes = useMemo(() => getResponsiveSizes(screenWidth), [screenWidth]);
  
  // Memoize navigation functions
  const navigateToWallet = useCallback(() => navigation.navigate('Wallet' as never), [navigation]);
  const navigateToNotifications = useCallback(() => navigation.navigate('Notifications' as never), [navigation]);
  const navigateToTipShorts = useCallback(() => navigation.navigate('TipShorts' as never), [navigation]);

  // Memoize search handlers
  const handleSearchIconPress = useCallback(() => {
    setIsSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss();
    setIsSearchActive(false);
    setSearchQueryLocal('');
    if (onSearchQueryChange) {
      onSearchQueryChange(''); // Notify that search is cleared
    }
  }, [onSearchQueryChange]);

  const handleSearchQueryChangeInternal = useCallback((text: string) => {
    setSearchQueryLocal(text);
    if (onSearchQueryChange) {
      onSearchQueryChange(text); // <<< CALL THE NEW PROP
    }
  }, [onSearchQueryChange]);
  
  const handleSearchSubmitInternal = useCallback(() => { // Renamed
    Keyboard.dismiss();
    if (searchQueryLocal.trim() && onSearchSubmit) {
      onSearchSubmit(searchQueryLocal.trim());
    }
    // Optionally, if onSearchSubmit is not provided but onSearchQueryChange is,
    // you might still want to call onSearchQueryChange here if the behavior is desired.
    // For now, it's distinct.
  }, [searchQueryLocal, onSearchSubmit]);

  // Memoize derived values
  const defaultShowLogo = useMemo(() => !isScreenHeader(), []);
  const actualShowLogo = useMemo(() => 
    typeof showLogo === 'boolean' ? showLogo : defaultShowLogo
  , [showLogo, defaultShowLogo]);
  
  const shouldShowTipShortsIconProp = useMemo(() => !!showTipShortsIcon, [showTipShortsIcon]);

  const renderNodeSafely = (node: React.ReactNode, defaultStyle?: any): React.ReactNode => {
    if (node === null || node === undefined || typeof node === 'boolean') {
      return null; // React handles these by rendering nothing
    }
    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>{renderNodeSafely(child, defaultStyle)}</React.Fragment>
      ));
    }
    if (typeof node === 'string') {
      return <Text style={defaultStyle}>{node}</Text>;
    }
    if (typeof node === 'number') {
      return <Text style={defaultStyle}>{node.toString()}</Text>;
    }
    if (React.isValidElement(node)) {
      return node; // It's already a React element
    }
    // Fallback for other unexpected types, though React.ReactNode should cover most.
    console.warn('Header: Encountered an unexpected child type in renderNodeSafely:', node);
    return null;
  };

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
        {leftComponent !== undefined ? renderNodeSafely(leftComponent, styles.title) : (
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
            {title && !centerComponent && (
              <Text 
                numberOfLines={1} 
                ellipsizeMode="tail"
                style={[styles.title, {color: colors.text.primary, fontSize: sizes.titleSize, marginLeft: actualShowLogo ? sizes.iconSpacing / 2 : 0 }]}
              >
                {title}
              </Text>
            )}
          </>
        )}
      </View>

      {/* --- CENTER SECTION --- */}
      <View style={[styles.centerSectionContainer, { marginHorizontal: sizes.iconSpacing / 2 }]}>
        {isSearchActive && showSearch ? (
          <>
            <TextInput
              ref={searchInputRef}
              style={[
                styles.searchInput, 
                {
                  color: colors.text.primary, 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  fontSize: sizes.titleSize > 16 ? sizes.titleSize - 2 : sizes.titleSize,
                }
              ]}
              placeholder="Search..." // Generic placeholder
              value={searchQueryLocal}
              onChangeText={handleSearchQueryChangeInternal} // <<< USE INTERNAL HANDLER
              onSubmitEditing={handleSearchSubmitInternal} // <<< USE INTERNAL HANDLER
              returnKeyType="search"
              autoFocus={true}
            />
            {searchQueryLocal.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQueryLocal('');
                if (onSearchQueryChange) onSearchQueryChange('');
              }} style={styles.searchClearIcon}>
                <Icon name="x" size={sizes.iconSize * 0.8} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </>
        ) : centerComponent !== undefined ? (
          <View style={styles.centerComponent}>{renderNodeSafely(centerComponent, styles.title)}</View>
        ) : (
          <View style={{flex: 1}} /> 
        )}
      </View>

      {/* --- RIGHT SECTION --- */}
      <View style={styles.rightSection}>
        {rightComponent !== undefined ? renderNodeSafely(rightComponent, styles.title) : (
          <>
            {rightIcon && onRightIconPress && (
              <TouchableOpacity
                onPress={onRightIconPress}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}
              >
                <Icon name={rightIcon} size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            {shouldShowTipShortsIconProp && (
              <TouchableOpacity
                onPress={navigateToTipShorts}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}
              >
                <Icon name="play-circle" size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            {isSearchActive ? (
              <TouchableOpacity onPress={handleCloseSearch} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}>
                <Icon name="x" size={sizes.iconSize} color={colors.text.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSearchIconPress} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}>
                <Icon name="search" size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            {showNotifications && (
              <TouchableOpacity
                onPress={navigateToNotifications}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}
              >
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
            {showWallet && (
              <TouchableOpacity
                onPress={navigateToWallet}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}
              >
                <Icon name="credit-card" size={sizes.iconSize} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

// Move this outside component to prevent recreation
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSectionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerComponent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    resizeMode: 'contain',
  },
  title: {
    fontWeight: 'bold',
    flexShrink: 1,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
  },
  searchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchClearIcon: {
    paddingLeft: 6,
    paddingRight: 2,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(Header); // Memoize the entire component