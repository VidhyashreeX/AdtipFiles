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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Generate a random avatar URL using DiceBear API if none provided
  const getRandomAvatarUrl = (userId: string | number) => {
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${userId || Math.random()}`;
  };

  useEffect(() => {
    const fetchChannel = async () => {
      if (!user || !user.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await fetch(`https://api.adtip.in/api/getchannelbyuserid/${user.id}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        const result = await response.json();
        if (result.status === 200 && result.data && result.data.length > 0) {
          const channel = result.data[0];
          const mappedChannel: ChannelData = {
            channelId: String(channel.channelId),
            channelName: channel.channelName,
            description: channel.description || '',
            avatar: channel.profileImage || getRandomAvatarUrl(user.id),
            followers: Number(channel.totalSubscribers) || 0,
            totalViews: Number(channel.totalVideos) || 0,
            isCallEnabled: false,
          };
          setChannelData(mappedChannel);
          // Store channelId in AsyncStorage
          await AsyncStorage.setItem('channelId', mappedChannel.channelId);
          navigation.replace('Channel', { channelId: mappedChannel.channelId });
        } else {
          setChannelData(null);
        }
      } catch (err: any) {
        if (err.message.includes('404')) {
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
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const payload = {
        channelName,
        channelDescription: description,
        profileImageURL: getRandomAvatarUrl(user.id), // Use random avatar for now
        coverImageURL: '', // Optional, set to empty if not provided
        createdBy: Number(user.id),
        updatedBy: Number(user.id),
      };

      const response = await fetch('https://api.adtip.in/api/savemychannel', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      const channelId = String(result.data?.channelId || user.id); // Adjust based on actual API response
      // Store channelId in AsyncStorage
      await AsyncStorage.setItem('channelId', channelId);
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Channel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#24d05a" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Channel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={goBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Channel</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formContainer}
      >
        <View style={styles.formContent}>
          <Text style={styles.title}>Create your TipTube channel</Text>
          <Text style={styles.subtitle}>
            Start sharing your content and earn money through views and engagement
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Channel Name</Text>
            <TextInput
              style={styles.input}
              value={channelName}
              onChangeText={setChannelName}
              placeholder="Enter channel name"
              maxLength={50}
              onBlur={() => {
                if (channelName && channelName.length < 3) {
                  setNameError('Channel name must be at least 3 characters');
                }
              }}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell viewers about your channel"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, (!channelName || nameError) && styles.disabledButton]}
            onPress={handleCreateChannel}
            disabled={!channelName || !!nameError}
          >
            <Text style={styles.createButtonText}>Create Channel</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
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
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24d05a',
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
    color: '#24d05a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#24d05a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryButton: {
    backgroundColor: '#24d05a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateChannelScreen;