import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

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
  const { colors } = useTheme();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    darkMode: false,
    autoPlay: true,
    cellularData: false,
    analytics: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Handle logout
            console.log('User logged out');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          title: 'Push Notifications',
          subtitle: 'Receive notifications on your device',
          type: 'toggle',
          icon: 'bell',
          value: settings.pushNotifications,
          onToggle: (value: boolean) => updateSetting('pushNotifications', value),
        },
        {
          id: 'email',
          title: 'Email Notifications',
          subtitle: 'Receive notifications via email',
          type: 'toggle',
          icon: 'mail',
          value: settings.emailNotifications,
          onToggle: (value: boolean) => updateSetting('emailNotifications', value),
        },
      ] as SettingItem[],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          type: 'toggle',
          icon: 'moon',
          value: settings.darkMode,
          onToggle: (value: boolean) => updateSetting('darkMode', value),
        },
        {
          id: 'autoPlay',
          title: 'Auto-play Videos',
          subtitle: 'Automatically play videos in feed',
          type: 'toggle',
          icon: 'play',
          value: settings.autoPlay,
          onToggle: (value: boolean) => updateSetting('autoPlay', value),
        },
        {
          id: 'cellularData',
          title: 'Use Cellular Data',
          subtitle: 'Allow video streaming on cellular',
          type: 'toggle',
          icon: 'smartphone',
          value: settings.cellularData,
          onToggle: (value: boolean) => updateSetting('cellularData', value),
        },
      ] as SettingItem[],
    },
    {
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
          value: settings.analytics,
          onToggle: (value: boolean) => updateSetting('analytics', value),
        },
      ] as SettingItem[],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          type: 'navigation',
          icon: 'help-circle',
          onPress: () => console.log('Navigate to Help & Support'),
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
          onPress: () => console.log('Navigate to About'),
        },
      ] as SettingItem[],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          title: 'Sign Out',
          type: 'action',
          icon: 'log-out',
          onPress: handleLogout,
        },
        {
          id: 'delete',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          type: 'action',
          icon: 'trash-2',
          onPress: handleDeleteAccount,
        },
      ] as SettingItem[],
    },
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        { borderBottomColor: colors.border.light },
        isLast && styles.lastItem
      ]}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Icon 
            name={item.icon} 
            size={20} 
            color={item.id === 'delete' ? '#FF6B6B' : colors.text.secondary}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingTitle, 
            { color: item.id === 'delete' ? '#FF6B6B' : colors.text.primary }
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.text.secondary }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          {item.type === 'toggle' && item.onToggle && (
            <Switch
              value={item.value || false}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.border.light, true: colors.primary + '40' }}
              thumbColor={item.value ? colors.primary : colors.text.secondary}
            />
          )}
          {item.type === 'navigation' && (
            <Icon name="chevron-right" size={20} color={colors.text.secondary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" showBackButton />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
              {section.items.map((item, itemIndex) => 
                renderSettingItem(item, itemIndex === section.items.length - 1)
              )}
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.text.tertiary }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  actionContainer: {
    marginLeft: 12,
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
