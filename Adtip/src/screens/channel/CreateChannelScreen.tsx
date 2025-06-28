import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import { SaveChannelRequest } from '../../types/api';
import { getFallbackAvatarUrl, getSecureMediaUrl } from '../../utils/mediaUtils';

type RootStackParamList = {
  TabHome: undefined;
  Explore: undefined;
  CreatePost: undefined;
  SelectCategory: undefined;
  TipTubeUpload: undefined;
  TipShorts: { shortId: string };
  TipShortsUpload: undefined;
  PromotePost: undefined;
  VideoPreview: { postId: string };
  Video: undefined;
  Channel: { channelId: string };
  CreateChannel: undefined;
  Packages: undefined;
  ChoosePackages: undefined;
  Checkout: undefined;
  Analytics: { channelId: string };
  Profile: { userId?: number };
  Wallet: undefined;
  TrackOrder: undefined;
  Search: undefined;
  Notifications: undefined;
  Settings: undefined;
  Earnings: undefined;
  Referral: undefined;
  PlayToEarn: undefined;
  WatchToEarn: undefined;
  AdPassbook: undefined;
  Support: undefined;
  CreateCampaign: undefined;
  Comments: { postId: number };
  FollowersList: { followers: any[]; userId?: number };
  FollowingsList: { followings: any[]; userId?: number };
  ChannelSettings: undefined;
  Upload: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ChannelData {
  channelId: string;
  channelName: string;
  description: string;
  avatar?: string;
  followers?: number;
  totalViews?: number;
  isCallEnabled?: boolean;
}

interface User {
  id: number | string;
}

const CreateChannelScreen: React.FC = () => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  useEffect(() => {
    const fetchChannel = async () => {
      if (!user || !user.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await ApiService.getChannelByUserId(Number(user.id));
        if (response.status === 200 && response.data && response.data.length > 0) {
          const channel = response.data[0];
          const mappedChannel: ChannelData = {
            channelId: String(channel.channelId),
            channelName: channel.channelName,
            description: channel.description || '',
            avatar: channel.profileImage ? await getSecureMediaUrl(channel.profileImage) : getFallbackAvatarUrl(user.id),
            followers: Number(channel.totalSubscribers) || 0,
            totalViews: Number(channel.total_ads_view) || 0, // Corrected from totalVideos
            isCallEnabled: false,
          };
          setChannelData(mappedChannel);
          navigation.replace('Channel', { channelId: mappedChannel.channelId });
        } else {
          setChannelData(null);
        }
      } catch (err: any) {
        if (err.message?.includes('404')) {
          setChannelData(null);
        } else {
          setError('Failed to fetch channel data. Try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [user, navigation]);

  const validateForm = () => {
    let isValid = true;

    if (!channelName.trim()) {
      setNameError('Channel name is required');
      isValid = false;
    } else if (channelName.length < 3) {
      setNameError('Channel name must be at least 3 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };
  const handleCreateChannel = async () => {
    if (!validateForm()) return;

    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const payload: SaveChannelRequest = {
        channelName,
        channelDescription: description,
        profileImageURL: getFallbackAvatarUrl(user.id), // Use fallback avatar for now
        coverImageURL: '', // Optional, set to empty if not provided
        createdBy: Number(user.id),
        updatedBy: Number(user.id),
      };

      const response = await ApiService.saveMyChannel(payload);
      const channelId = String(response.data?.channelId || user.id); // Adjust based on actual API response
      navigation.replace('Analytics', { channelId });
    } catch (error: any) {
      console.error('Failed to create channel:', error.message);
      setNameError('Failed to create channel. Try again.');
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Create Channel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Create Channel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={goBack}>
            <Text style={[styles.retryButtonText, { color: colors.white }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Create Channel</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formContainer}
      >
        <View style={styles.formContent}>
          <Text style={[styles.title, { color: colors.primary }]}>Create your TipTube channel</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Start sharing your content and earn money through views and engagement
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Channel Name</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border, 
                backgroundColor: colors.surface,
                color: colors.text.primary
              }]}
              value={channelName}
              onChangeText={setChannelName}
              placeholder="Enter channel name"
              placeholderTextColor={colors.text.tertiary}
              maxLength={50}
              onBlur={() => {
                if (channelName && channelName.length < 3) {
                  setNameError('Channel name must be at least 3 characters');
                }
              }}
            />
            {nameError ? <Text style={[styles.errorText, { color: colors.error }]}>{nameError}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: colors.border, 
                backgroundColor: colors.surface,
                color: colors.text.primary
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell viewers about your channel"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.createButton, 
              { backgroundColor: colors.primary },
              (!channelName || nameError) && { backgroundColor: colors.text.tertiary }
            ]}
            onPress={handleCreateChannel}
            disabled={!channelName || !!nameError}
          >
            <Text style={[styles.createButtonText, { color: colors.white }]}>Create Channel</Text>
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
            By creating a channel, you agree to TipTube's Terms of Service and Community Guidelines
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateChannelScreen;