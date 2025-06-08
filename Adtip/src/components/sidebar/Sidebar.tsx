import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useNavigation, useFocusEffect, useNavigationState} from '@react-navigation/native';
import * as NavigationService from '../../navigation/NavigationService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface MenuItem {
  icon: string;
  label: string;
  screen: string;
}

const Sidebar: React.FC = () => {  
  const {colors, isDarkMode} = useTheme();
  const {isSidebarOpen, closeSidebar} = useSidebar();
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('TabHome');
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Use useNavigationState to track navigation changes more reliably
  const navigationState = useNavigationState(state => state);

  // Helper function to get current route name from navigation state
  const getCurrentRouteName = useCallback((state: any): string => {
    if (!state || !state.routes || state.routes.length === 0) {
      return 'TabHome';
    }

    const route = state.routes[state.index];
    
    // Handle the main app navigation structure: Auth -> Main -> TabHome -> Tab screens
    if (route.name === 'Main' && route.state) {
      // We're in the main navigator
      const mainRoute = route.state.routes[route.state.index];
      
      if (mainRoute.name === 'TabHome' && mainRoute.state) {
        // We're in the tab navigator
        const tabRoute = mainRoute.state.routes[mainRoute.state.index];
        return mapTabToSidebarScreen(tabRoute.name);
      } else {
        // We're in a screen within the main navigator (not tab navigator)
        return mapScreenToSidebarScreen(mainRoute.name);
      }
    }
    
    // Handle other cases
    return mapScreenToSidebarScreen(route.name);
  }, []);
  // Track navigation state changes
  useEffect(() => {
    if (navigationState) {
      const currentRoute = getCurrentRouteName(navigationState);
      setActiveScreen(currentRoute);
    }
  }, [navigationState, getCurrentRouteName]);

  // Use focus effect to update active screen when component becomes focused
  // This helps with hardware back button and other navigation changes
  useFocusEffect(
    useCallback(() => {
      if (navigationState) {
        const currentRoute = getCurrentRouteName(navigationState);
        setActiveScreen(currentRoute);
      }
    }, [navigationState, getCurrentRouteName])
  );

  // Handle Android back button when sidebar is open
  useEffect(() => {
    const backAction = () => {
      if (isSidebarOpen) {
        closeSidebar();
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => backHandler.remove();
  }, [isSidebarOpen, closeSidebar]);
  // Map tab screen names to sidebar screen names
  const mapTabToSidebarScreen = useCallback((tabName: string): string => {
    const tabMapping: { [key: string]: string } = {
      'Home': 'TabHome',
      'TipTube': 'TabHome', // TipTube is part of the home tab experience
      'TipCall': 'TabHome', // TipCall is part of the home tab experience  
      'Profile': 'Profile',
      'TipShop': 'TabHome', // TipShop is part of the home tab experience
    };
    return tabMapping[tabName] || 'TabHome';
  }, []);

  // Map other screen names to sidebar screen names
  const mapScreenToSidebarScreen = useCallback((screenName: string): string => {
    const screenMapping: { [key: string]: string } = {
      'TabHome': 'TabHome',
      'Main': 'TabHome',
      'Search': 'Search', 
      'Explore': 'Explore', // Add this mapping
      'Wallet': 'Wallet',
      'Referral': 'Referral',
      'Settings': 'Settings',
      'Profile': 'Profile',
      'TipShorts': 'TipShorts',
      'Notifications': 'Settings', // Map to settings as notifications might be accessed from there
      'CreatePost': 'TabHome',
      'CreateChannel': 'TabHome',
      'Video': 'TabHome',
      'VideoPreview': 'TabHome', 
      'Shorts': 'TipShorts',
      'Channel': 'Profile', // Channel is related to profile
      'Analytics': 'Profile', // Analytics is related to profile 
      'Packages': 'Wallet', // Packages are related to wallet/payments
      'ChoosePackages': 'Wallet',
      'Checkout': 'Wallet',
      'TrackOrder': 'Wallet',
      'Earnings': 'Wallet', // Earnings are related to wallet
      'SelectCategory': 'TabHome',
      'TipTubeUpload': 'TabHome',
      'TipShortsUpload': 'TipShorts',
      'PromotePost': 'TabHome',
      // Add any missing screens here and map them appropriately
      'PlayToEarn': 'PlayToEarn',
      'WatchToEarn': 'WatchToEarn', 
      'AdPassbook': 'AdPassbook',
    };
    return screenMapping[screenName] || 'TabHome';
  }, []);
  
  // Calculate sidebar width based on screen size
  const getSidebarWidth = () => {
    if (width < 360) return width * 0.85; // Small phones - almost full width
    if (width < 768) return width * 0.75; // Regular phones - 75% width
    return Math.min(width * 0.4, 400); // Tablets and larger - 40% width or max 400px
  };
  
  // Calculate dynamic sizes based on screen width
  const getFontSizes = () => {
    if (width < 360) {
      return {
        menuIconSize: 18,
        menuTextSize: 14,
        headerIconSize: 32,
        welcomeTextSize: 18,
      };
    } else if (width < 480) {
      return {
        menuIconSize: 20,
        menuTextSize: 16,
        headerIconSize: 40,
        welcomeTextSize: 22,
      };
    } else {
      return {
        menuIconSize: 24,
        menuTextSize: 18, 
        headerIconSize: 48,
        welcomeTextSize: 24,
      };
    }
  };
  
  const sidebarWidth = getSidebarWidth();
  const sizes = getFontSizes();
  const menuItems: MenuItem[] = [
    {icon: 'home', label: 'Home', screen: 'TabHome'},
    {icon: 'compass', label: 'Explore', screen: 'Explore'}, // Changed icon to 'compass' for better semantics and screen to 'Explore'
    {icon: 'credit-card', label: 'Wallet', screen: 'Wallet'},
    {icon: 'users', label: 'Refer & Earn', screen: 'Referral'},
    {icon: 'play', label: 'Play to Earn', screen: 'PlayToEarn'},
    {icon: 'film', label: 'Watch to Earn', screen: 'WatchToEarn'},
    {icon: 'book-open', label: 'My Ad Passbook', screen: 'AdPassbook'},
    {icon: 'user', label: 'View Profile', screen: 'Profile'},
    {icon: 'video', label: 'Tip Shorts', screen: 'TipShorts'},
    {icon: 'settings', label: 'Settings', screen: 'Settings'},
  ];  const navigateTo = useCallback((screenName: string) => {
    closeSidebar();
    
    // Small delay to allow sidebar to close smoothly before navigation
    setTimeout(() => {
      try {
        // Handle special navigation cases
        if (screenName === 'TabHome') {
          // Navigate to the main tab home
          NavigationService.navigate('TabHome');
        } else if ([
          'Search', 'Wallet', 'Referral', 'Settings', 'Profile', 'TipShorts',
          'PlayToEarn', 'WatchToEarn', 'AdPassbook', 'Explore' // Add 'Explore' here
        ].includes(screenName)) {
          // These are top-level screens in the MainNavigator
          NavigationService.navigate(screenName);
        } else {
          // For other screens that might not exist yet, default to TabHome
          NavigationService.navigate('TabHome');
        }
      } catch (error) {
        console.warn('Navigation error:', error);
        // Fallback to TabHome if navigation fails
        NavigationService.navigate('TabHome');
      }
    }, 300);
  }, [closeSidebar]);const renderMenuItem = useCallback((item: MenuItem, index: number) => {
    const isActive = activeScreen === item.screen;
    
    return (
      <TouchableOpacity
        key={item.screen} // Use screen name as key for better performance
        style={[
          styles.menuItem, 
          {
            backgroundColor: isActive 
              ? isDarkMode 
                ? `${colors.primary}20` // 20 is hex for 12% opacity 
                : 'rgba(0, 120, 212, 0.1)' 
              : 'transparent'
          }
        ]}
        onPress={() => navigateTo(item.screen)}
        activeOpacity={0.7}>
        <View style={[
          styles.iconContainer, 
          {
            backgroundColor: isActive ? colors.primary : 'transparent',
            width: sizes.menuIconSize * 2,
            height: sizes.menuIconSize * 2
          }
        ]}>
          <Icon 
            name={item.icon as any} 
            size={sizes.menuIconSize} 
            color={isActive ? '#fff' : colors.text.primary} 
          />
        </View>
        <Text 
          style={[
            styles.menuItemText, 
            {
              color: isActive ? colors.primary : colors.text.primary,
              fontWeight: isActive ? '700' : '500',
              fontSize: sizes.menuTextSize
            }
          ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }, [activeScreen, isDarkMode, colors.primary, colors.text.primary, sizes.menuIconSize, sizes.menuTextSize, navigateTo]);
  const translateX = React.useRef(new Animated.Value(-sidebarWidth)).current;

  // Update the animation when the sidebar width changes (e.g., on rotation)
  useEffect(() => {
    translateX.setValue(isSidebarOpen ? 0 : -sidebarWidth);
  }, [sidebarWidth, isSidebarOpen]);

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isSidebarOpen ? 0 : -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen, translateX, sidebarWidth]);

  // If sidebar is not open, don't render anything
  if (!isSidebarOpen) {
    return null;
  }  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.overlay,
          {
            // In dark mode, use a slightly more transparent overlay
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.5)'
          }
        ]}
        activeOpacity={1}
        onPress={closeSidebar}
      /><Animated.View
          style={[
            styles.sidebar,
            {
              backgroundColor: colors.background,
              transform: [{translateX}],
              width: sidebarWidth,
              shadowOpacity: isDarkMode ? 0.4 : 0.25, // Stronger shadow in dark mode
              elevation: isDarkMode ? 8 : 5,
            },
        ]}>
        {/* Sidebar Header */}        <View style={[
          styles.sidebarHeader, 
          {
            borderBottomColor: colors.borderLight,
            paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 50 : 30
          }
        ]}>
          <View style={styles.profileSection}>            <Icon 
              name="user" 
              size={sizes.headerIconSize} 
              color={colors.primary} 
              style={{
                backgroundColor: isDarkMode 
                  ? `${colors.primary}20` // 20 is hex for 12% opacity
                  : 'rgba(0, 120, 212, 0.1)',
                padding: sizes.headerIconSize * 0.25,
                borderRadius: 30,
              }}
            />
            <Text style={[
              styles.welcomeText, 
              {
                color: colors.text.primary,
                fontSize: sizes.welcomeTextSize,
                marginLeft: sizes.welcomeTextSize * 0.7
              }
            ]}>
              Welcome
            </Text>
          </View>
        </View>        
        {/* Menu Items */}
        <ScrollView 
          style={styles.menuItems}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: Math.max(insets.bottom, 20)}}
        >
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },  sidebarHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontWeight: '600',
  },
  menuItems: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 50, // Extra padding at bottom for scroll space
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 10,
    position: 'relative',
  },
  iconContainer: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontWeight: '500',
  },
});

export default Sidebar;
