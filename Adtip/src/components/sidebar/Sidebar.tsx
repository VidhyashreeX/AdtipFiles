// filepath: c:\adtip-reactnative\Adtip\src\components\sidebar\Sidebar.tsx
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ScrollView,
  BackHandler,
  Image, // ADD THIS
  // StatusBar, // No longer directly used for padding logic here
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TouchableOpacity, // ADD TouchableOpacity import here
} from 'react-native-gesture-handler';
import {useTheme} from '../../contexts/ThemeContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useNavigation, useFocusEffect, useNavigationState} from '@react-navigation/native';
import * as NavigationService from '../../navigation/NavigationService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { MainNavigatorParamList } from '../../types/navigation';

interface MenuItemProps {
  icon: string;
  label: string;
  screen: keyof MainNavigatorParamList;
}

// Optimized MenuItem component for individual animation
const AnimatedMenuItem: React.FC<{
  item: MenuItemProps;
  index: number;
  isActive: boolean;
  onPress: () => void;
  isSidebarOpen: boolean;
  colors: any; // Replace with your specific theme colors type
  isDarkMode: boolean;
  sizes: { menuIconSize: number; menuTextSize: number };
}> = React.memo(({ item, index, isActive, onPress, isSidebarOpen, colors, isDarkMode, sizes }) => {
  const itemAnimatedStyle = useAnimatedStyle(() => {
    // Determine target values based on isSidebarOpen (same as logo section)
    const targetOpacity = isSidebarOpen ? 1 : 0;
    const targetTranslateY = isSidebarOpen ? 0 : -20;

    // Apply animations directly without complex interpolation (same as logo section)
    const animatedOpacity = withDelay(
      index * 40, // Stagger delay for each menu item
      withTiming(targetOpacity, {
        duration: isSidebarOpen ? 450 : 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    const animatedTranslateY = withDelay(
      index * 40, // Same stagger delay
      withTiming(targetTranslateY, {
        duration: isSidebarOpen ? 450 : 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    return {
      opacity: animatedOpacity,
      transform: [
        {
          translateY: animatedTranslateY,
        },
      ],
    };
  });

  return (
    <Animated.View style={itemAnimatedStyle}>
      <TouchableOpacity
        style={[
          styles.menuItem,
          { backgroundColor: isActive ? (isDarkMode ? `${colors.primary}20` : `${colors.primary}1A`) : 'transparent' }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: isActive ? colors.primary : 'transparent', width: sizes.menuIconSize * 1.8, height: sizes.menuIconSize * 1.8 }
        ]}>
          <Icon name={item.icon as any} size={sizes.menuIconSize} color={isActive ? (isDarkMode ? colors.text.primary : '#FFFFFF') : colors.text.primary} />
        </View>
        <Text style={[
          styles.menuItemText,
          { color: isActive ? colors.primary : colors.text.primary, fontWeight: isActive ? '600' : '500', fontSize: sizes.menuTextSize }
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const Sidebar: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const {isSidebarOpen, closeSidebar, openSidebar} = useSidebar(); // Assuming openSidebar exists
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState<keyof MainNavigatorParamList>('TabHome');
  const {width: windowWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const navigationState = useNavigationState(state => state);

  const sidebarWidth = useMemo(() => {
    if (windowWidth < 360) return windowWidth * 0.85;
    if (windowWidth < 768) return windowWidth * 0.75;
    return Math.min(windowWidth * 0.45, 320); // Max width for larger screens
  }, [windowWidth]);

  const sizes = useMemo(() => {
    if (windowWidth < 360) {
      return { menuIconSize: 18, menuTextSize: 14, headerIconSize: 28, welcomeTextSize: 16, headerPadding: 12 };
    } else if (windowWidth < 480) {
      return { menuIconSize: 20, menuTextSize: 15, headerIconSize: 32, welcomeTextSize: 18, headerPadding: 16 };
    } else {
      return { menuIconSize: 22, menuTextSize: 16, headerIconSize: 36, welcomeTextSize: 20, headerPadding: 20 };
    }
  }, [windowWidth]);

  const mapTabToSidebarScreen = useCallback((tabName: string): keyof MainNavigatorParamList => {
    const tabMapping: { [key: string]: keyof MainNavigatorParamList } = {
      'Home': 'TabHome', 'TipTube': 'TabHome', 'TipCall': 'TabHome',
      'Profile': 'Profile', 'TipShop': 'TabHome',
    };
    return tabMapping[tabName] || 'TabHome';
  }, []);

  const mapScreenToSidebarScreen = useCallback((screenName: string): keyof MainNavigatorParamList => {
    const screenMapping: { [key: string]: keyof MainNavigatorParamList } = {
      'TabHome': 'TabHome', 'Main': 'TabHome', 'Search': 'Search', 'Explore': 'Explore',
      'Wallet': 'Wallet', 'Referral': 'Referral', 'Settings': 'Settings', 'Profile': 'Profile',
      'TipShorts': 'TipShorts', 'Notifications': 'Settings', 'CreatePost': 'TabHome',
      'CreateChannel': 'TabHome', 'Video': 'TabHome', 'VideoPreview': 'TabHome',
      'Shorts': 'TipShorts', 'Channel': 'Profile', 'Analytics': 'Profile',
      'Packages': 'Wallet', 'ChoosePackages': 'Wallet', 'Checkout': 'Wallet',
      'TrackOrder': 'Wallet', 'Earnings': 'Earnings', 'SelectCategory': 'TabHome',
      'TipTubeUpload': 'TabHome', 'TipShortsUpload': 'TipShorts', 'PromotePost': 'TabHome',
      'PlayToEarn': 'PlayToEarn', 'WatchToEarn': 'WatchToEarn', 'AdPassbook': 'AdPassbook',
    };
    return screenMapping[screenName] || 'TabHome';
  }, []);

  const getCurrentRouteName = useCallback((state: any): keyof MainNavigatorParamList => {
    if (!state || !state.routes || state.routes.length === 0) return 'TabHome';
    const route = state.routes[state.index];
    if (route.name === 'Main' && route.state) {
      const mainRoute = route.state.routes[route.state.index];
      if (mainRoute.name === 'TabHome' && mainRoute.state) {
        const tabRoute = mainRoute.state.routes[mainRoute.state.index];
        return mapTabToSidebarScreen(tabRoute.name);
      }
      return mapScreenToSidebarScreen(mainRoute.name);
    }
    return mapScreenToSidebarScreen(route.name);
  }, [mapTabToSidebarScreen, mapScreenToSidebarScreen]);

  useEffect(() => {
    if (navigationState) {
      setActiveScreen(getCurrentRouteName(navigationState));
    }
  }, [navigationState, getCurrentRouteName]);

  useFocusEffect(
    useCallback(() => {
      if (navigationState) {
        setActiveScreen(getCurrentRouteName(navigationState));
      }
    }, [navigationState, getCurrentRouteName])
  );

  // Reanimated Shared Values
  const translateX = useSharedValue(-sidebarWidth);
  const overlayOpacity = useSharedValue(0);
  const [isSidebarVisibleInDOM, setIsSidebarVisibleInDOM] = useState(false);

   // REMOVE the following useEffect block (previously around lines 131-136 in your full file)
  // as its logic is covered by the corrected main animation useEffect below,
  // and having both can lead to conflicts.
  /*
  useEffect(() => {
    // Update initial position if sidebarWidth changes (e.g., on rotation while closed)
    if (!isSidebarOpen) {
      translateX.value = -sidebarWidth;
    }
  }, [sidebarWidth, isSidebarOpen, translateX]);
  */

  // CORRECTED main animation useEffect (previously around lines 138-156 in your full file)
  useEffect(() => {
    if (isSidebarOpen) {
      runOnJS(setIsSidebarVisibleInDOM)(true); // Ensure component is in DOM for animations
      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 120,
        mass: 0.9,
      });
      overlayOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      // Animate to closed state
      translateX.value = withTiming(-sidebarWidth, { // sidebarWidth will be the current value
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      }, (finished) => {
        // Only remove from DOM after closing animation is complete
        if (finished && !isSidebarOpen) { // Add !isSidebarOpen check to be safe if rapidly toggled
          runOnJS(setIsSidebarVisibleInDOM)(false);
        }
      });
      overlayOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) });
    }
  }, [isSidebarOpen, sidebarWidth]); // Corrected dependencies


  useEffect(() => {
    const backAction = () => {
      if (isSidebarOpen) {
        closeSidebar();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSidebarOpen, closeSidebar]);

  const menuItems: MenuItemProps[] = useMemo(() => [
    {icon: 'home', label: 'Home', screen: 'TabHome'},
    {icon: 'compass', label: 'Explore', screen: 'Explore'},
    {icon: 'credit-card', label: 'Wallet', screen: 'Wallet'},
    {icon: 'users', label: 'Refer & Earn', screen: 'Referral'},
    {icon: 'play', label: 'Play to Earn', screen: 'PlayToEarn'},
    {icon: 'film', label: 'Watch to Earn', screen: 'TipTube'},
    {icon: 'book-open', label: 'My Ad Passbook', screen: 'AdPassbook'},
    {icon: 'user', label: 'View Profile', screen: 'Profile'},
    {icon: 'video', label: 'Tip Shorts', screen: 'TipShorts'},
    {icon: 'settings', label: 'Settings', screen: 'Settings'},
    {icon: 'dollar-sign', label: 'My Earnings', screen: 'Earnings'},
  ], []);

  const handleNavigate = useCallback((screenName: keyof MainNavigatorParamList) => {
    // Start sidebar closing animation immediately
    closeSidebar();
    
    // Use a shorter delay for more responsive navigation
    setTimeout(() => {
      try {
        // Special handling for nested screens like TipTube
        if (screenName === 'TipTube') {
          // Navigate to the parent tab navigator, then to the specific screen
          NavigationService.navigate('TabHome', { screen: 'TipTube' });
        } else if (screenName === 'Profile') {
          NavigationService.navigate('Profile', { userId: undefined }); // Current user profile
        } else {
          // Direct navigation for other screens
          NavigationService.navigate(screenName);
        }
      } catch (error) {
        console.warn('Navigation error:', error, 'navigating to screen:', screenName);
        // Fallback to home if navigation fails
        NavigationService.navigate('TabHome');
      }
    }, 100); // Reduced delay for more responsive feel
  }, [closeSidebar]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 1000]) // Activate only for swipes from left edge or on sidebar
    .onUpdate((event) => {
      if (isSidebarOpen) { // Dragging to close
        translateX.value = Math.min(0, Math.max(-sidebarWidth, event.translationX));
      } else { // Dragging to open (from edge)
         if (event.translationX > 0) {
            translateX.value = Math.min(0, -sidebarWidth + event.translationX);
         }
      }
      overlayOpacity.value = interpolate(
        translateX.value,
        [-sidebarWidth, 0],
        [0, 1],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const threshold = sidebarWidth * 0.4;
      if (isSidebarOpen) {
        if (event.translationX < -threshold || event.velocityX < -500) {
          runOnJS(closeSidebar)();
        } else {
          translateX.value = withSpring(0, { damping: 18, stiffness: 120 });
          overlayOpacity.value = withTiming(1);
        }
      } else {
         if (event.translationX > threshold || event.velocityX > 500) {
            if (openSidebar) runOnJS(openSidebar)(); else translateX.value = withSpring(0); // Fallback if openSidebar not in context
         } else {
            translateX.value = withTiming(-sidebarWidth);
            overlayOpacity.value = withTiming(0);
         }
      }
    });

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    // pointerEvents: overlayOpacity.value > 0 ? 'auto' : 'none', // Control touchability
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => {
    // Determine target values based on isSidebarOpen 
    const targetOpacity = isSidebarOpen ? 1 : 0;
    const targetTranslateY = isSidebarOpen ? 0 : -20;

    // Apply animations directly without complex interpolation
    const animatedOpacity = withTiming(targetOpacity, {
      duration: isSidebarOpen ? 450 : 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    const animatedTranslateY = withTiming(targetTranslateY, {
      duration: isSidebarOpen ? 450 : 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    return {
      opacity: animatedOpacity,
      transform: [
        {
          translateY: animatedTranslateY,
        },
      ],
    };
  });

  if (!isSidebarVisibleInDOM && !isSidebarOpen) { // Keep in DOM during closing animation
    return null;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <View style={styles.container} pointerEvents={isSidebarOpen ? 'auto' : 'none'}>
        <Animated.View style={[styles.overlay, overlayAnimatedStyle, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeSidebar}
            disabled={!isSidebarOpen}
          />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sidebar,
              sidebarAnimatedStyle,
              {
                backgroundColor: colors.background,
                width: sidebarWidth,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Animated.View style={[styles.sidebarHeader, headerAnimatedStyle, {paddingHorizontal: sizes.headerPadding}]}>
              <View style={styles.logoSection}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={[styles.logoImage, { width: sizes.headerIconSize * 1.2, height: sizes.headerIconSize * 1.2 }]}
                />
                <Text style={[styles.logoText, { color: colors.text.primary, fontSize: sizes.welcomeTextSize * 1.1 }]}>
                  Adtip
                </Text>
              </View>
            </Animated.View>

            <ScrollView
              style={styles.menuItemsScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: sizes.headerPadding, paddingTop: 8 }}
            >
              {menuItems.map((item, index) => (
                <AnimatedMenuItem
                  key={item.screen}
                  item={item}
                  index={index}
                  isActive={activeScreen === item.screen}
                  onPress={() => handleNavigate(item.screen)}
                  isSidebarOpen={isSidebarOpen}
                  colors={colors}
                  isDarkMode={isDarkMode}
                  sizes={sizes}
                />
              ))}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000, // Ensure sidebar is on top
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 16,
  },
  sidebarHeader: {
    paddingBottom: 20, // Increased space below header content
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)', // Use theme color
    marginBottom: 12, // Increased margin
    alignItems: 'flex-start', // Align to the left instead of center
    paddingTop: 16, // Add top padding for better spacing
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align to the left
    paddingVertical: 8, // Add vertical padding to make section bigger
    paddingLeft: 12, // Add left padding to align with menu item icons
  },
  logoImage: {
    resizeMode: 'contain',
    marginRight: 16, // Increased space between logo and text
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  menuItemsScroll: {
    flex: 1, // Ensure ScrollView takes available space
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Adjusted padding
    paddingHorizontal: 12,
    marginBottom: 6, // Reduced margin
    borderRadius: 8,
  },
  iconContainer: {
    borderRadius: 6, // Slightly smaller radius
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // Adjusted margin
  },
  menuItemText: {
    // fontWeight and fontSize set dynamically
  },
});

export default Sidebar;

/**
 * NAVIGATION STRUCTURE FIX COMPLETE ✅
 * 
 * PROBLEM: 
 * Navigation error: The action 'NAVIGATE' with payload {"name":"Main","params":{"screen":"PlayToEarn"}} 
 * was not handled by any navigator.
 * 
 * ROOT CAUSE:
 * The app uses UltraFastLoader which renders MainNavigator DIRECTLY (not through a Root Stack with "Main" screen).
 * But several places were trying to navigate like: navigate('Main', { screen: 'PlayToEarn' })
 * This assumes a nested navigation structure that doesn't exist.
 * 
 * ACTUAL STRUCTURE:
 * UltraFastLoader → MainNavigator (contains PlayToEarn, TipCall, etc. screens directly)
 * 
 * SOLUTION:
 * Fixed all navigation calls to navigate directly to screens:
 * - ❌ navigate('Main', { screen: 'PlayToEarn' }) 
 * - ✅ navigate('PlayToEarn')
 * 
 * FIXED FILES:
 * 1. Sidebar.tsx - Main navigation fixes for all menu items
 * 2. FirebaseService.ts - Delayed navigation fixes
 * 3. CheckoutScreen.tsx - Success navigation fix  
 * 4. CallNotificationHandler.ts - Call notification navigation fixes
 * 
 * PlayToEarn now correctly navigates to ChooseGamesScreen.tsx ✅
 */
