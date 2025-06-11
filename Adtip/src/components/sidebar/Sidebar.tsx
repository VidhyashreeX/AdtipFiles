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
  StatusBar, // Added StatusBar for consistency if needed for padding
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import {useSidebar} from '../../contexts/SidebarContext';
import {useNavigation, useFocusEffect, useNavigationState} from '@react-navigation/native';
import * as NavigationService from '../../navigation/NavigationService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { MainNavigatorParamList } from '../../types/navigation'; // Import MainNavigatorParamList

interface MenuItem {
  icon: string;
  label: string;
  screen: keyof MainNavigatorParamList; // Make screen type more specific
}

const Sidebar: React.FC = () => {  
  const {colors, isDarkMode} = useTheme();
  const {isSidebarOpen, closeSidebar} = useSidebar();
  const navigation = useNavigation();
  const [activeScreen, setActiveScreen] = useState('TabHome');
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const navigationState = useNavigationState(state => state);

  const getCurrentRouteName = useCallback((state: any): string => {
    if (!state || !state.routes || state.routes.length === 0) {
      return 'TabHome'; // Default or initial screen
    }

    const route = state.routes[state.index];
    
    if (route.name === 'Main' && route.state) {
      const mainRoute = route.state.routes[route.state.index];
      if (mainRoute.name === 'TabHome' && mainRoute.state) {
        const tabRoute = mainRoute.state.routes[mainRoute.state.index];
        return mapTabToSidebarScreen(tabRoute.name);
      } else {
        return mapScreenToSidebarScreen(mainRoute.name);
      }
    }
    return mapScreenToSidebarScreen(route.name);
  }, []);

  useEffect(() => {
    if (navigationState) {
      const currentRoute = getCurrentRouteName(navigationState);
      setActiveScreen(currentRoute);
    }
  }, [navigationState, getCurrentRouteName]);

  useFocusEffect(
    useCallback(() => {
      if (navigationState) {
        const currentRoute = getCurrentRouteName(navigationState);
        setActiveScreen(currentRoute);
      }
    }, [navigationState, getCurrentRouteName])
  );

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

  const mapTabToSidebarScreen = useCallback((tabName: string): string => {
    const tabMapping: { [key: string]: string } = {
      'Home': 'TabHome',
      'TipTube': 'TabHome', 
      'TipCall': 'TabHome',  
      'Profile': 'Profile',
      'TipShop': 'TabHome', 
    };
    return tabMapping[tabName] || 'TabHome';
  }, []);

  const mapScreenToSidebarScreen = useCallback((screenName: string): string => {
    const screenMapping: { [key: string]: string } = {
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
  
  const getSidebarWidth = () => {
    if (width < 360) return width * 0.85;
    if (width < 768) return width * 0.75;
    return Math.min(width * 0.4, 400);
  };
  
  const getFontSizes = () => {
    if (width < 360) {
      return { menuIconSize: 18, menuTextSize: 14, headerIconSize: 32, welcomeTextSize: 18 };
    } else if (width < 480) {
      return { menuIconSize: 20, menuTextSize: 16, headerIconSize: 40, welcomeTextSize: 22 };
    } else {
      return { menuIconSize: 24, menuTextSize: 18, headerIconSize: 48, welcomeTextSize: 24 };
    }
  };
  
  const sidebarWidth = getSidebarWidth();
  const sizes = getFontSizes();

  // Ensure menuItems use keyof MainNavigatorParamList for screen
  const menuItems: MenuItem[] = [
    {icon: 'home', label: 'Home', screen: 'TabHome'},
    {icon: 'compass', label: 'Explore', screen: 'Explore'},
    {icon: 'credit-card', label: 'Wallet', screen: 'Wallet'},
    {icon: 'users', label: 'Refer & Earn', screen: 'Referral'},
    {icon: 'play', label: 'Play to Earn', screen: 'PlayToEarn'},
    {icon: 'film', label: 'Watch to Earn', screen: 'WatchToEarn'},
    {icon: 'book-open', label: 'My Ad Passbook', screen: 'AdPassbook'},
    {icon: 'user', label: 'View Profile', screen: 'Profile'},
    {icon: 'video', label: 'Tip Shorts', screen: 'TipShorts'},
    {icon: 'settings', label: 'Settings', screen: 'Settings'},
    {icon: 'dollar-sign', label: 'My Earnings', screen: 'Earnings'},
  ];  
  
  const navigateTo = useCallback((screenName: keyof MainNavigatorParamList) => {
      closeSidebar();
      setTimeout(() => {
        try {
          // Type assertion ensures screenName is treated as a specific string literal
          NavigationService.navigate('Main', {
            screen: screenName as any,
          });
        } catch (error) {
          console.warn('Navigation error:', error, 'navigating to screen:', screenName);
          NavigationService.navigate('Main', { screen: 'TabHome' as any });
        }
      }, 300);
    }, [closeSidebar]);
  
  const renderMenuItem = useCallback((item: MenuItem, index: number) => {
    const isActive = activeScreen === item.screen;
    return (
      <TouchableOpacity
        key={item.screen}
        style={[
          styles.menuItem, 
          { backgroundColor: isActive ? (isDarkMode ? `${colors.primary}20` : 'rgba(0, 120, 212, 0.1)') : 'transparent' }
        ]}
        onPress={() => navigateTo(item.screen)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isActive ? colors.primary : 'transparent', width: sizes.menuIconSize * 2, height: sizes.menuIconSize * 2 }
        ]}>
          <Icon name={item.icon as any} size={sizes.menuIconSize} color={isActive ? '#fff' : colors.text.primary} />
        </View>
        {/* item.label is a string and is correctly rendered within this Text component */}
        <Text style={[
          styles.menuItemText, 
          { color: isActive ? colors.primary : colors.text.primary, fontWeight: isActive ? '700' : '500', fontSize: sizes.menuTextSize }
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }, [activeScreen, isDarkMode, colors.primary, colors.text.primary, sizes.menuIconSize, sizes.menuTextSize, navigateTo]);
  
  const translateX = React.useRef(new Animated.Value(-sidebarWidth)).current;

  useEffect(() => {
    translateX.setValue(isSidebarOpen ? 0 : -sidebarWidth);
  }, [sidebarWidth, isSidebarOpen, translateX]); // Added translateX to dependency array

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isSidebarOpen ? 0 : -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen, translateX, sidebarWidth]);

  if (!isSidebarOpen) {
    return null;
  }  
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[ styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.5)' } ]}
        activeOpacity={1}
        onPress={closeSidebar}
      />
      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.background,
            transform: [{translateX}],
            width: sidebarWidth,
            shadowOpacity: isDarkMode ? 0.4 : 0.25,
            elevation: isDarkMode ? 8 : 5,
          },
        ]}
      >
        <View style={[
          styles.sidebarHeader, 
          { borderBottomColor: colors.borderLight, paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 50 : 30 }
        ]}>
          <View style={styles.profileSection}>            
            <Icon 
              name="user" 
              size={sizes.headerIconSize} 
              color={colors.primary} 
              style={{
                backgroundColor: isDarkMode ? `${colors.primary}20` : 'rgba(0, 120, 212, 0.1)',
                padding: sizes.headerIconSize * 0.25,
                borderRadius: 30, // Consider making this dynamic, e.g., sizes.headerIconSize * 0.5
              }}
            />
            {/* "Welcome" is a string literal and is correctly rendered within this Text component */}
            <Text style={[
              styles.welcomeText, 
              { color: colors.text.primary, fontSize: sizes.welcomeTextSize, marginLeft: sizes.welcomeTextSize * 0.7 }
            ]}>
              Welcome
            </Text>
          </View>
        </View>        
        <ScrollView 
          style={styles.menuItemsScroll} // Renamed for clarity from styles.menuItems
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
  },  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor is set dynamically
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    // paddingTop: 0, // paddingTop is handled by sidebarHeader with insets
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    // shadowOpacity is set dynamically
    shadowRadius: 3.84,
    // elevation is set dynamically
  },  
  sidebarHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, // Use hairlineWidth for a thinner border
    marginBottom: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontWeight: '600',
  },
  menuItemsScroll: { // Renamed from menuItems to avoid conflict if menuItems was a style object
    paddingHorizontal: 24,
    paddingTop: 16, // Keep some padding from the header
    // paddingBottom is handled by contentContainerStyle
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 10,
    // position: 'relative', // Not obviously needed here
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
