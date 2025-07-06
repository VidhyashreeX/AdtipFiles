import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import {useNavigation} from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import ScreenTransition from '../../components/common/ScreenTransition';
// import {useUserSettings, useUpdateUserSettings} from '../../hooks/useQueries';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: string;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const SettingsScreen: React.FC = () => {
  const {colors, isDarkMode, toggleTheme, setDarkMode} = useTheme();
  const navigation = useNavigation();
  const { logout, loading: authLoading, user } = useAuth();
  const userId = user?.id || 0;

  // TanStack Query hooks
  // const userSettingsQuery = useUserSettings(userId);
  // const updateSettingsMutation = useUpdateUserSettings();

  const [localSettings, setLocalSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    darkMode: isDarkMode,
    autoPlay: true,
    cellularData: false,
    analytics: true,
  });

  // Update local settings when API data loads
  // React.useEffect(() => {
  //   if (userSettingsQuery.data) {
  //     setLocalSettings(prev => ({
  //       ...prev,
  //       ...userSettingsQuery.data,
  //       darkMode: isDarkMode, // Keep theme setting local
  //     }));
  //   }
  // }, [userSettingsQuery.data, isDarkMode]);

  const updateSetting = useCallback((key: string, value: boolean) => {
    setLocalSettings(prev => ({...prev, [key]: value}));
    
    // Update settings via API
    // updateSettingsMutation.mutate({
    //   user_id: userId,
    //   [key]: value
    // });
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // Navigation to login/onboarding screen is handled within the logout function in AuthContext
            console.log('User logged out successfully and navigated.');
          } catch (error) {
            console.error('Failed to logout:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'Please contact support to delete your account.',
            );
          },
        },
      ],
    );
  };

  const settingSections = [
    {
      title: 'Permissions',
      items: [
        {
          id: 'permissions',
          title: 'Permissions',
          subtitle: 'Manage app permissions (Notifications, Camera, Audio, etc.)',
          type: 'navigation',
          icon: 'settings',
          onPress: () => navigation.navigate('PermissionsScreen' as never),
        },
      ] as SettingItem[],
    },
    {
      title: 'Preferences',
      items: [        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          type: 'toggle',
          icon: 'moon',
          value: isDarkMode,
          onToggle: (value: boolean) => {
            updateSetting('darkMode', value);
            setDarkMode(value);
          },
        },
        {
          id: 'autoPlay',
          title: 'Auto-play Videos',
          subtitle: 'Automatically play videos in feed',
          type: 'toggle',
          icon: 'play',
          value: localSettings.autoPlay,
          onToggle: (value: boolean) => updateSetting('autoPlay', value),
        },
        {
          id: 'cellularData',
          title: 'Use Cellular Data',
          subtitle: 'Allow video streaming on cellular',
          type: 'toggle',
          icon: 'smartphone',
          value: localSettings.cellularData,
          onToggle: (value: boolean) => updateSetting('cellularData', value),
        },
      ] as SettingItem[],
    },
    /*{
      title: 'Privacy & Security',
      items: [
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy preferences',
          type: 'navigation',
          icon: 'shield',
          onPress: () => console.log('Navigate to Privacy Settings'),
        },
        {
          id: 'security',
          title: 'Security',
          subtitle: 'Two-factor authentication, password',
          type: 'navigation',
          icon: 'lock',
          onPress: () => console.log('Navigate to Security Settings'),
        },
        {
          id: 'analytics',
          title: 'Analytics & Data',
          subtitle: 'Help improve the app',
          type: 'toggle',
          icon: 'bar-chart',
          value: localSettings.analytics,
          onToggle: (value: boolean) => updateSetting('analytics', value),
        },
      ] as SettingItem[],
    },*/
    {
      title: 'Support',
      items: [        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          type: 'navigation',
          icon: 'help-circle',
          onPress: () => navigation.navigate('Support' as never),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Report bugs or suggest features',
          type: 'navigation',
          icon: 'message-square',
          onPress: () => console.log('Navigate to Feedback'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and legal information',
          type: 'navigation',
          icon: 'info',
          onPress: () => navigation.navigate('PrivacyPolicy' as never),
        },
      ] as SettingItem[],
    },  ];

  // Show loading state while fetching settings
  // if (userSettingsQuery.isLoading) {
  //   return (
  //     <ScreenTransition animationType="fade">
  //       <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
  //         <Header title="Settings"/>
  //         <View style={styles.loadingContainer}>
  //           <ActivityIndicator size="large" color={colors.primary} />
  //           <Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading settings...</Text>
  //         </View>
  //       </SafeAreaView>
  //     </ScreenTransition>
  //   );
  // }

  return (
    <ScreenTransition animationType="fade">
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
        <Header title="Settings"
        showSearch={false}
        showWallet={false}
        />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingTop: 16}}>
          {settingSections.map((section, sectionIdx) => {
            // Define section colors
            const sectionColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
            const sectionColor = sectionColors[sectionIdx] || '#6B7280';
            
            return (
              <View key={section.title} style={{marginBottom: 24}}>
                {/* Section Header with Accent Bar */}
                <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginBottom: 8}}>
                  <View style={{
                    width: 4, 
                    height: 20, 
                    borderRadius: 2, 
                    backgroundColor: sectionColor, 
                    marginRight: 12
                  }} />
                  <Text style={[styles.sectionTitle, {
                    color: colors.text.primary, 
                    fontSize: 15, 
                    fontWeight: '600', 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 0
                  }]}>
                    {section.title}
                  </Text>
                </View>
                
                {/* Section Content Card */}
                <View style={[styles.sectionContent, {
                  backgroundColor: isDarkMode ? colors.card : '#FFFFFF', 
                  borderRadius: 12, 
                  marginHorizontal: 16,
                  shadowColor: isDarkMode ? '#000000' : '#000000', 
                  shadowOpacity: isDarkMode ? 0.3 : 0.08, 
                  shadowRadius: 12, 
                  shadowOffset: {width: 0, height: 4},
                  elevation: 3
                }]}> 
                  {section.items.map((item, itemIndex) => {
                    const isLast = itemIndex === section.items.length - 1;
                    const iconBg = item.id === 'logout' || item.id === 'delete' ? '#EF444415' : sectionColor + '15';
                    const iconColor = item.id === 'logout' || item.id === 'delete' ? '#EF4444' : sectionColor;
                    
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={{
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          paddingHorizontal: 16, 
                          paddingVertical: 14, 
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, 
                          borderBottomColor: isDarkMode ? colors.border : '#F1F5F9',
                          backgroundColor: 'transparent'
                        }} 
                        onPress={item.onPress}
                        disabled={item.type === 'toggle'}
                        activeOpacity={0.8}
                      >
                        {/* Icon Container */}
                        <View style={{
                          width: 36, 
                          height: 36, 
                          borderRadius: 10, 
                          backgroundColor: iconBg, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          marginRight: 12
                        }}>
                          <Icon name={item.icon} size={18} color={iconColor} />
                        </View>
                        
                        {/* Text Content */}
                        <View style={{flex: 1}}>
                          <Text style={{
                            fontSize: 16, 
                            fontWeight: '500', 
                            color: item.id === 'delete' ? '#EF4444' : colors.text.primary
                          }}>
                            {item.title}
                          </Text>
                          {!!item.subtitle && (
                            <Text style={{
                              fontSize: 13, 
                              color: colors.text.secondary, 
                              marginTop: 1,
                              lineHeight: 18
                            }}>
                              {item.subtitle}
                            </Text>
                          )}
                        </View>
                        
                        {/* Action Component */}
                        <View style={{marginLeft: 8}}>
                          {item.type === 'toggle' && item.onToggle && (
                            <Switch
                              value={item.value || false}
                              onValueChange={item.onToggle}
                              trackColor={{false: isDarkMode ? '#374151' : '#E5E7EB', true: sectionColor + '40'}}
                              thumbColor={item.value ? sectionColor : (isDarkMode ? '#9CA3AF' : '#FFFFFF')}
                              ios_backgroundColor={isDarkMode ? '#374151' : '#E5E7EB'}
                              disabled={false}
                            />
                          )}
                          {item.type === 'navigation' && (
                            <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
          
          {/* Sign Out Button */}
          <TouchableOpacity
            style={{
              marginHorizontal: 16, 
              marginTop: 8, 
              marginBottom: 0, 
              backgroundColor: authLoading ? '#F87171' : '#EF4444', // Dim if loading 
              borderRadius: 12, 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 16, 
              shadowColor: '#EF4444', 
              shadowOpacity: 0.25, 
              shadowRadius: 12, 
              shadowOffset: {width: 0, height: 4},
              elevation: 4
            }}
            onPress={handleLogout}
            activeOpacity={0.9}
            disabled={authLoading} // Disable button when auth operation is in progress
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name="log-out" size={18} color="#FFFFFF" style={{marginRight: 8}} />
                <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 16}}>Sign Out</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={[styles.version, {color: colors.text.tertiary}]}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  version: {
    fontSize: 14,
  },
});

export default SettingsScreen;
