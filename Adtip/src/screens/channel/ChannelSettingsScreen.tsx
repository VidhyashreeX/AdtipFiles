import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useContentCreatorPremium } from '../../contexts/ContentCreatorPremiumContext';
import Icon from 'react-native-vector-icons/Feather';
import { Settings, Phone, Video, MessageCircle, Crown, Shield, Bell } from 'lucide-react-native';
import ApiService from '../../services/ApiService';
import { UpdateChannelRequest } from '../../types/api';

interface ChannelData {
  channelId: string;
  channelName: string;
  description: string;
  isCallEnabled?: boolean;
}

const ChannelSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { 
    isContentCreatorPremium, 
    contentCreatorPremiumData, 
    loading: contentCreatorPremiumLoading 
  } = useContentCreatorPremium();
  
  // State management
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallEnabled, setIsCallEnabled] = useState(false);
  const [isVideoCallEnabled, setIsVideoCallEnabled] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateChannel, setPrivateChannel] = useState(false);

  // Load channel data
  useEffect(() => {
    loadChannelData();
  }, []);

  const loadChannelData = async () => {
    try {
      setIsLoading(true);
      if (!user?.id) return;
      
      const response = await ApiService.getChannelByUserId(Number(user.id));
      
      if (response.data && response.data.length > 0) {
        const channelData = response.data[0];
        const channel: ChannelData = {
          channelId: channelData.channelId || user.id,
          channelName: channelData.channelName || '',
          description: channelData.description || '',
          isCallEnabled: channelData.isCallEnabled || false,
        };
        
        setChannel(channel);
        setIsCallEnabled(channel.isCallEnabled || false);
        // Initialize other settings based on channel data or defaults
        setIsVideoCallEnabled(channelData.isVideoCallEnabled || false);
        setIsChatEnabled(channelData.isChatEnabled || false);
      }
    } catch (error) {
      console.error('Error loading channel data:', error);
      Alert.alert('Error', 'Failed to load channel settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle call settings
  const toggleCallSetting = async (settingType: 'call' | 'videoCall' | 'chat', value: boolean) => {
    if (!channel) return;

    try {
      const updateData: UpdateChannelRequest = {
        id: Number(channel.channelId),
        channelName: channel.channelName,
        channelDescription: channel.description,
        profileImageURL: '',
      };

      const response = await ApiService.updateChannel(updateData);
      
      if (response.status === 200) {
        setChannel(prev => prev ? { ...prev, isCallEnabled: value } : null);
        
        // Update local state
        switch (settingType) {
          case 'call':
            setIsCallEnabled(value);
            break;
          case 'videoCall':
            setIsVideoCallEnabled(value);
            break;
          case 'chat':
            setIsChatEnabled(value);
            break;
        }
      }
    } catch (error) {
      console.error('Error updating call settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  // Handle premium toggle
  const handleTogglePremium = () => {
    navigation.navigate('ContentCreatorPremium' as never);
  };

  // Render setting item
  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    disabled: boolean = false
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.surface }]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.background : colors.textSecondary}
        disabled={disabled}
      />
    </View>
  );

  // Render action item
  const renderActionItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    onPress: () => void,
    showChevron: boolean = true
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.surface }]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      {showChevron && (
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Channel Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Channel Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Communication Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Communication</Text>
          
          {renderSettingItem(
            <Phone size={20} color={colors.primary} />,
            'Voice Calls',
            'Allow followers to make voice calls to you',
            isCallEnabled,
            (value) => toggleCallSetting('call', value)
          )}
          
          {renderSettingItem(
            <Video size={20} color={colors.primary} />,
            'Video Calls',
            'Allow followers to make video calls to you',
            isVideoCallEnabled,
            (value) => toggleCallSetting('videoCall', value)
          )}
          
          {renderSettingItem(
            <MessageCircle size={20} color={colors.primary} />,
            'Chat Messages',
            'Allow followers to send you messages',
            isChatEnabled,
            (value) => toggleCallSetting('chat', value)
          )}
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Privacy</Text>
          
          {renderSettingItem(
            <Shield size={20} color={colors.primary} />,
            'Private Channel',
            'Make your channel private and require approval for followers',
            privateChannel,
            setPrivateChannel
          )}
          
          {renderSettingItem(
            <Bell size={20} color={colors.primary} />,
            'Notifications',
            'Receive notifications for channel activity',
            notificationsEnabled,
            setNotificationsEnabled
          )}
        </View>

        {/* Premium Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Premium</Text>
          
          {renderActionItem(
            <Crown size={20} color={isContentCreatorPremium ? '#10B981' : colors.primary} />,
            isContentCreatorPremium ? 'Premium Active' : 'Upgrade to Premium',
            isContentCreatorPremium 
              ? `Current plan: ${contentCreatorPremiumData?.plan_name || 'Premium Plan'}`
              : 'Get access to premium content creation features',
            handleTogglePremium,
            false
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Account</Text>
          
          {renderActionItem(
            <Settings size={20} color={colors.primary} />,
            'Edit Channel',
            'Update your channel name, description, and images',
            () => navigation.navigate('EditChannel' as never, { channelId: channel?.channelId })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});

export default ChannelSettingsScreen;
