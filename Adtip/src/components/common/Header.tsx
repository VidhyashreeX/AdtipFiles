// src/components/common/Header.tsx
import React, {useState, useRef, useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, Image, useWindowDimensions, Platform, TextInput, Keyboard, Animated} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import {useWallet} from '../../contexts/WalletContext';
import {useUserDataContext, useUserPremiumStatus, useUserWallet} from '../../contexts/UserDataContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useCallStore } from '../../stores/callStoreSimplified';
import { useGuestGuard } from '../../hooks/useGuestGuard';
import LoginPromptModal from '../modals/LoginPromptModal';

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
  searchQuery?: string; // External search query value
  showSearch?: boolean;
  showPremium?: boolean; // New prop to control premium button visibility
  showProfile?: boolean; // New prop to control profile icon visibility
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
  const session = useCallStore((state) => state.session);
  const callDuration = session?.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0;
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
  searchQuery,
  showSearch = true,
  showPremium = true,
  showProfile = true,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors, isDarkMode} = useTheme();
  const {isGuest} = useAuth();
  const {balance, isLoading, isPremium} = useWallet();
  // Enhanced user data from new system (with fallback to old system)
  const { userData, isLoading: userDataLoading } = useUserDataContext();
  const { isPremium: isPremiumNew } = useUserPremiumStatus();
  const { walletBalance: walletBalanceNew } = useUserWallet();
  const {toggleSidebar} = useSidebar();
  const { requireAuth, loginPromptVisible, hideLoginPrompt, loginPromptMessage } = useGuestGuard();
  const {width: screenWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets(); 
  const searchInputRef = useRef<TextInput>(null);
  const session = useCallStore(state => state.session);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQueryLocal, setSearchQueryLocal] = useState('');

  // Use external search query if provided, otherwise use local state
  const currentSearchQuery = searchQuery !== undefined ? searchQuery : searchQueryLocal;

  // Animation for premium toggle
  const toggleAnimation = useRef(new Animated.Value(isPremium ? 1 : 0)).current;

  // Update animation when premium status changes
  React.useEffect(() => {
    Animated.timing(toggleAnimation, {
      toValue: isPremium ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isPremium, toggleAnimation]);

  // Memoize expensive calculations
  const sizes = useMemo(() => getResponsiveSizes(screenWidth), [screenWidth]);
  
  // Memoize navigation functions
  const navigateToWallet = useCallback(() => {
    console.log('🚀 [Header] User clicked wallet icon, navigating to Wallet');
    navigation.navigate('Wallet' as never);
  }, [navigation]);
  
  const navigateToPremium = useCallback(() => {
    console.log('🚀 [Header] User clicked premium toggle, navigating to PremiumUser');
    console.log('📊 [Header] Current premium status:', { isPremium, balance });
    navigation.navigate('PremiumUser' as never);
  }, [navigation, isPremium, balance]);

  const navigateToLibrary = useCallback(() => {
    console.log('🚀 [Header] User clicked profile icon, navigating to Library');
    navigation.navigate('Library' as never);
  }, [navigation]);

  // Memoize search handlers
  const handleSearchIconPress = useCallback(() => {
    if (onSearchSubmit) {
      // If onSearchSubmit is provided, use it (for navigation)
      onSearchSubmit('');
    } else {
      // Default behavior: activate search input
      setIsSearchActive(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [onSearchSubmit]);

  // Determine if we should show the built-in search input
  const shouldShowBuiltInSearch = useMemo(() => {
    return isSearchActive && showSearch && !onSearchSubmit;
  }, [isSearchActive, showSearch, onSearchSubmit]);

  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss();
    // If there's text in the search, clear it first, otherwise close the search
    if (currentSearchQuery.trim()) {
      if (searchQuery !== undefined) {
        // External search query - use callback
        if (onSearchQueryChange) {
          onSearchQueryChange('');
        }
      } else {
        // Local search query
        setSearchQueryLocal('');
        if (onSearchQueryChange) {
          onSearchQueryChange('');
        }
      }
    } else {
      setIsSearchActive(false);
      if (searchQuery !== undefined) {
        if (onSearchQueryChange) {
          onSearchQueryChange('');
        }
      } else {
        setSearchQueryLocal('');
        if (onSearchQueryChange) {
          onSearchQueryChange('');
        }
      }
    }
  }, [onSearchQueryChange, currentSearchQuery, searchQuery]);

  const handleSearchQueryChangeInternal = useCallback((text: string) => {
    if (searchQuery !== undefined) {
      // External search query - use callback only
      if (onSearchQueryChange) {
        onSearchQueryChange(text);
      }
    } else {
      // Local search query
      setSearchQueryLocal(text);
      if (onSearchQueryChange) {
        onSearchQueryChange(text);
      }
    }
  }, [onSearchQueryChange, searchQuery]);
  
  const handleSearchSubmitInternal = useCallback(() => {
    Keyboard.dismiss();
    if (currentSearchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(currentSearchQuery.trim());
    }
  }, [currentSearchQuery, onSearchSubmit]);

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

  // Premium toggle switch component
  const renderPremiumToggle = () => {
    if (!showPremium) return null;

    const switchWidth = 44;
    const switchHeight = 24;
    const circleSize = 20;
    const circleOffset = 2;

    const backgroundColor = toggleAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['#FF4444', '#4CAF50'], // Red for off, Green for on
    });

    const circlePosition = toggleAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [circleOffset, switchWidth - circleSize - circleOffset],
    });

    return (
      <TouchableOpacity
        style={[styles.premiumToggleContainer, { marginLeft: sizes.iconSpacing / 2 }]}
        onPress={() => requireAuth('premium', navigateToPremium)}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.premiumToggleBackground,
            {
              backgroundColor,
              width: switchWidth,
              height: switchHeight,
              borderRadius: switchHeight / 2,
            }
          ]}
        >
          <Animated.View
            style={[
              styles.premiumToggleCircle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                transform: [{ translateX: circlePosition }],
              }
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Check if call is active and we are NOT on the meeting screen
  const isCallActiveInBackground = session && route.name !== 'Meeting';

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
            <TouchableOpacity
              onPress={toggleSidebar}
              style={styles.menuButton}
            >
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
              <View style={styles.titleContainer}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.title, {color: colors.text.primary, fontSize: sizes.titleSize, marginLeft: actualShowLogo ? sizes.iconSpacing / 2 : 0 }]}
                >
                  {title}
                </Text>
                {isGuest && (
                  <View style={[styles.guestBadge, { backgroundColor: colors.border, borderColor: colors.primary }]}>
                    <Text style={[styles.guestBadgeText, { color: colors.primary }]}>Guest</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* --- CENTER SECTION --- */}
      <View style={[styles.centerSectionContainer, { marginHorizontal: sizes.iconSpacing / 2 }]}>
        {isCallActiveInBackground ? (
          <LiveCallTimer />
        ) : shouldShowBuiltInSearch ? (
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
              value={currentSearchQuery}
              onChangeText={handleSearchQueryChangeInternal}
              onSubmitEditing={handleSearchSubmitInternal}
              returnKeyType="search"
              autoFocus={true}
            />
            {/* Removed duplicate clear icon - the main close button in right section serves this purpose */}
          </>
        ) : centerComponent !== undefined ? (
          <View style={styles.centerComponent}>{renderNodeSafely(centerComponent, styles.title)}</View>
        ) : (
          <View style={{flex: 1}} /> 
        )}
      </View>

      {/* --- RIGHT SECTION --- */}
      <View style={styles.rightSection}>
        {rightComponent !== undefined ? (
          renderNodeSafely(rightComponent, styles.title)
        ) : (
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
              shouldShowBuiltInSearch ? (
                <TouchableOpacity onPress={handleCloseSearch} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}>
                  <Icon
                    name={currentSearchQuery.trim() ? "delete" : "x"}
                    size={sizes.iconSize}
                    color={colors.text.primary}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSearchIconPress} style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}>
                  <Icon name="search" size={sizes.iconSize} color={colors.text.secondary} />
                </TouchableOpacity>
              )
            )}
            {/* Premium Toggle Switch - Between search and wallet */}
            {renderPremiumToggle()}
            {showWallet && (
              <TouchableOpacity
                onPress={() => requireAuth('wallet', navigateToWallet)}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}
              >
                <Icon name="credit-card" size={sizes.iconSize} color={colors.primary} />
              </TouchableOpacity>
            )}
            {showProfile && (
              <TouchableOpacity
                onPress={() => requireAuth('profile', navigateToLibrary)}
                style={[styles.iconButton, {marginLeft: sizes.iconSpacing /2}]}
              >
                <Icon name="user" size={sizes.iconSize} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Login Prompt Modal for Guest Mode Restrictions */}
      <LoginPromptModal
        visible={loginPromptVisible}
        onClose={hideLoginPrompt}
        message={loginPromptMessage}
      />
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  title: {
    fontWeight: 'bold',
    flexShrink: 1,
  },
  guestBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  guestBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  
  // Premium Toggle Switch Styles
  premiumToggleContainer: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumToggleBackground: {
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  premiumToggleCircle: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
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