// src/components/common/Header.tsx
import React, {useState, useRef, useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, Image, useWindowDimensions, Platform, TextInput, Keyboard} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTheme} from '../../contexts/ThemeContext';
import {useWallet} from '../../contexts/WalletContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCall} from '../../contexts/CallProvider';

export interface HeaderProps {
  title: string;
  showLogo?: boolean;
  showWallet?: boolean;
  walletAmount?: string;
  leftComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  rightIcon?: string;
  onRightIconPress?: () => void;
  showTipShortsIcon?: boolean;
  onSearchSubmit?: (query: string) => void;
  onSearchQueryChange?: (query: string) => void;
  showSearch?: boolean;
  showPremium?: boolean; // New prop to control premium button visibility
}

// Utility to help decide default logo visibility
function isScreenHeader(): boolean {
  return true; 
}

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  
  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
};

const LiveCallTimer: React.FC = () => {
  const navigation = useNavigation();
  const { callDuration } = useCall();
  const { colors } = useTheme();

  const handlePress = () => {
    (navigation as any).navigate('Main', { screen: 'Meeting' });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.liveTimerContainer, { backgroundColor: colors.success }]}>
      <Icon name="phone" size={14} color="#FFF" />
      <Text style={styles.liveTimerText}>{formatDuration(callDuration)}</Text>
    </TouchableOpacity>
  );
};

const Header: React.FC<HeaderProps> = ({
  title,
  showLogo,
  showWallet = true,
  walletAmount,
  leftComponent,
  centerComponent,
  rightComponent,
  rightIcon,
  onRightIconPress,
  showTipShortsIcon,
  onSearchSubmit,
  onSearchQueryChange,
  showSearch = true,
  showPremium = true, // Default to true to show premium button everywhere
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors, isDarkMode} = useTheme();
  const {balance, isLoading, isPremium} = useWallet(); 
  const {toggleSidebar} = useSidebar();
  const {width: screenWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets(); 
  const searchInputRef = useRef<TextInput>(null);
  const { activeCall } = useCall();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQueryLocal, setSearchQueryLocal] = useState('');

  // Memoize expensive calculations
  const sizes = useMemo(() => getResponsiveSizes(screenWidth), [screenWidth]);
  
  // Memoize navigation functions
  const navigateToWallet = useCallback(() => navigation.navigate('Wallet' as never), [navigation]);
  const navigateToPremium = useCallback(() => navigation.navigate('UpgradePremiumScreen' as never), [navigation]);

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
      onSearchQueryChange('');
    }
  }, [onSearchQueryChange]);

  const handleSearchQueryChangeInternal = useCallback((text: string) => {
    setSearchQueryLocal(text);
    if (onSearchQueryChange) {
      onSearchQueryChange(text);
    }
  }, [onSearchQueryChange]);
  
  const handleSearchSubmitInternal = useCallback(() => {
    Keyboard.dismiss();
    if (searchQueryLocal.trim() && onSearchSubmit) {
      onSearchSubmit(searchQueryLocal.trim());
    }
  }, [searchQueryLocal, onSearchSubmit]);

  // Memoized derived values
  const defaultShowLogo = useMemo(() => !isScreenHeader(), []);
  const actualShowLogo = useMemo(() => 
    typeof showLogo === 'boolean' ? showLogo : defaultShowLogo
  , [showLogo, defaultShowLogo]);
  
  const renderNodeSafely = (node: React.ReactNode, defaultStyle?: any): React.ReactNode => {
    if (node === null || node === undefined || typeof node === 'boolean') {
      return null;
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
      return node;
    }
    console.warn('Header: Encountered an unexpected child type in renderNodeSafely:', node);
    return null;
  };

  // Premium button component - only star icon
  const renderPremiumButton = () => {
    if (!showPremium) return null;

    return (
      <TouchableOpacity
        style={styles.premiumButton}
        onPress={navigateToPremium}
        activeOpacity={0.8}
      >
        <Icon 
          name={isPremium ? "star" : "star"} 
          size={sizes.iconSize} 
          color={isPremium ? "#FFD700" : colors.text.secondary}
        />
      </TouchableOpacity>
    );
  };

  // Check if call is active and we are NOT on the meeting screen
  const isCallActiveInBackground = activeCall && route.name !== 'Meeting';

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingHorizontal: sizes.paddingHorizontal,
          borderBottomColor: colors.borderLight,
          paddingTop: insets.top > 0 ? 8 : 12, // Adjust for safe area
        }
      ]}
    >
      {/* --- LEFT SECTION (NO BACK BUTTON) --- */}
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
        {isCallActiveInBackground ? (
          <LiveCallTimer />
        ) : isSearchActive && showSearch ? (
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
              placeholder="Search..."
              value={searchQueryLocal}
              onChangeText={handleSearchQueryChangeInternal}
              onSubmitEditing={handleSearchSubmitInternal}
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
            {showSearch && (
              isSearchActive ? (
                <TouchableOpacity onPress={handleCloseSearch} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}>
                  <Icon name="x" size={sizes.iconSize} color={colors.text.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSearchIconPress} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}>
                  <Icon name="search" size={sizes.iconSize} color={colors.text.secondary} />
                </TouchableOpacity>
              )
            )}
            {/* Premium Button - Between search and wallet */}
            {renderPremiumButton()}
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
  
  // Premium Button Styles - simplified to just contain the star
  premiumButton: {
    marginLeft: 8,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  liveTimerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
});

export default React.memo(Header);