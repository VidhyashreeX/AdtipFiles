import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';

type RootStackParamList = {
  TabHome: undefined;
  CreateChannel: undefined;
  ChannelSettings: undefined;
  TipTubeUpload: undefined;
  Analytics: { totalViews: number; followers: number; videos: number }; // Renamed from Preview to Analytics
};

type NavigationPropType = NavigationProp<RootStackParamList>;

interface ChannelData {
  createddate: string;
  channelId: string;
  channelName: string;
  description: string;
  avatar?: string;
  followers: number;
  totalViews: number;
  videos: number;
  totalEarnings: number;
  isCallEnabled?: boolean;
}

interface User {
  id: number | string;
}

const MyChannelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isCallEnabled, setIsCallEnabled] = useState(false);
  const [isVideoCallEnabled, setIsVideoCallEnabled] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'Videos' | 'Shorts' | 'Playlists' | 'About'>('Videos');

  const fetchChannelData = async () => {
    if (!user || !user.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication token not found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(https://api.adtip.in/api/getchannelbyuserid/${user.id}, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: Bearer ${token},
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      if (result.status === 200 && result.data && result.data.length > 0) {
        const channelData = result.data[0];
        const mappedChannel: ChannelData = {
          channelId: String(channelData.channelId),
          channelName: channelData.channelName,
          description: channelData.description || 'No description available',
          avatar: channelData.profileImage,
          followers: Number(channelData.totalSubscribers) || 0,
          totalViews: Number(channelData.totalVideos) || 0,
          videos: Number(channelData.totalVideos) || 0,
          totalEarnings: Number(channelData.total_earnings) || 0,
          isCallEnabled: false,
          createddate: channelData.createddate || '2025-04-11T20:36:35.000Z',
        };
        setChannel(mappedChannel);
        setIsCallEnabled(mappedChannel.isCallEnabled || false);
      } else {
        setChannel(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch channel:', err.message);
      setError('Failed to load channel data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log('Opening image library...');
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: false,
      });

      console.log('Image picker result:', result);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        Alert.alert('Cancelled', 'Image selection was cancelled.');
        return;
      }

      if (result.errorCode) {
        console.error('Image picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', Failed to pick image: ${result.errorMessage});
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        if (imageUri) {
          await uploadProfilePicture(imageUri);
        } else {
          console.error('No URI found in image picker result');
          Alert.alert('Error', 'No image URI found. Please try again.');
        }
      } else {
        console.error('No assets found in image picker result');
        Alert.alert('Error', 'No image selected. Please try again.');
      }
    } catch (err: any) {
      console.error('Unexpected error in pickImage:', err);
      Alert.alert('Error', 'An unexpected error occurred while picking the image.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    if (!channel || !user) {
      console.error('Channel or user not available');
      Alert.alert('Error', 'Channel or user data not available.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const uri = Platform.OS === 'android' && !imageUri.startsWith('file://')
        ? file://${imageUri}
        : imageUri;

      console.log('Uploading image with URI:', uri);

      const formData = new FormData();
      formData.append('channelId', channel.channelId);
      formData.append('profileImage', {
        uri: uri,
        type: 'image/jpeg',
        name: profile_${user.id}.jpg,
      } as any);

      console.log('FormData prepared:', formData);

      const response = await fetch('https://api.adtip.in/api/channel/update-profile-picture', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: Bearer ${token},
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Upload response:', result);

      if (result.status === 200 && result.data) {
        const newAvatar = result.data.profileImage || imageUri;
        console.log('New avatar URL:', newAvatar);
        setChannel({ ...channel, avatar: newAvatar });
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.error('Upload response invalid:', result);
        throw new Error('Failed to update profile picture');
      }
    } catch (err: any) {
      console.error('Failed to upload profile picture:', err.message);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, [user]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchChannelData();
  };

  const toggleCallSwitch = async () => {
    try {
      const newValue = !isCallEnabled;
      setIsCallEnabled(newValue);
      if (channel) {
        setChannel({ ...channel, isCallEnabled: newValue });
      }
    } catch (err: any) {
      setError('Failed to update call settings.');
    }
  };

  const toggleVideoCallSwitch = async () => {
    try {
      const newValue = !isVideoCallEnabled;
      setIsVideoCallEnabled(newValue);
    } catch (err: any) {
      setError('Failed to update video call settings.');
    }
  };

  const toggleChatSwitch = async () => {
    try {
      const newValue = !isChatEnabled;
      setIsChatEnabled(newValue);
    } catch (err: any) {
      setError('Failed to update chat settings.');
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const navigateToSettings = () => {
    navigation.navigate('ChannelSettings');
  };

  const handleTabPress = (tab: 'Videos' | 'Shorts' | 'Playlists' | 'About') => {
    setActiveTab(tab);
  };

  const navigateToAnalytics = () => {
    if (channel) {
      navigation.navigate('Analytics', {
        totalViews: channel.totalViews,
        followers: channel.followers,
        videos: channel.videos,
      });
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Your Channel</Text>
          <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
            <Icon name="settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Your Channel</Text>
          <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
            <Icon name="settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!channel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Create Channel</Text>
          <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
            <Icon name="settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            You don't have a channel yet
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateChannel')}
            style={[styles.createButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.createButtonText}>Create Channel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Channel</Text>
        <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
          <Icon name="settings" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: channel.avatar || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <TouchableOpacity onPress={pickImage} style={styles.addImageButton}>
              <Icon name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.channelName}>{channel.channelName}</Text>
          <View style={styles.actionIcons}>
            <TouchableOpacity onPress={navigateToAnalytics} style={styles.actionIconBox}>
              <Icon name="bar-chart-2" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={styles.actionIconBox}>
              <Icon name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.followersText}>{channel.followers} followers</Text>
          <Text style={styles.descriptionText}>{channel.description}</Text>
          <View style={styles.toggleSection}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>Call</Text>
              <Switch
                onValueChange={toggleCallSwitch}
                value={isCallEnabled}
                trackColor={{ false: '#767577', true: '#24d05a' }}
                thumbColor={isCallEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>Video Call</Text>
              <Switch
                onValueChange={toggleVideoCallSwitch}
                value={isVideoCallEnabled}
                trackColor={{ false: '#767577', true: '#24d05a' }}
                thumbColor={isVideoCallEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>Chat</Text>
              <Switch
                onValueChange={toggleChatSwitch}
                value={isChatEnabled}
                trackColor={{ false: '#767577', true: '#24d05a' }}
                thumbColor={isChatEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{channel.totalViews}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{channel.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{channel.videos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>

        <View style={styles.tabsSection}>
          <TouchableOpacity onPress={() => handleTabPress('Videos')}>
            <Text style={activeTab === 'Videos' ? styles.tabActive : styles.tab}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabPress('Shorts')}>
            <Text style={activeTab === 'Shorts' ? styles.tabActive : styles.tab}>Shorts</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabPress('Playlists')}>
            <Text style={activeTab === 'Playlists' ? styles.tabActive : styles.tab}>Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabPress('About')}>
            <Text style={activeTab === 'About' ? styles.tabActive : styles.tab}>About</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Videos' && (
          <View style={styles.videosSection}>
            <Text style={styles.sectionTitle}>Your Videos</Text>
            <Text style={styles.noVideosText}>You haven't uploaded any videos yet</Text>
          </View>
        )}

        {activeTab === 'Shorts' && (
          <View style={styles.videosSection}>
            <Text style={styles.sectionTitle}>Your Shorts</Text>
            <Text style={styles.noVideosText}>You haven't uploaded any shorts yet</Text>
          </View>
        )}

        {activeTab === 'Playlists' && (
          <View style={styles.videosSection}>
            <Text style={styles.sectionTitle}>Your Playlists</Text>
            <Text style={styles.noVideosText}>You haven't created any playlists yet</Text>
          </View>
        )}

        {activeTab === 'About' && (
          <View style={styles.videosSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{channel.description}</Text>
            <Text style={styles.descriptionText}>
              Channel created on: {new Date(channel.createddate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Total Earned</Text>
            <Text style={styles.earningsValue}>₹{channel.totalEarnings.toFixed(1)}</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Available Balance</Text>
            <Text style={styles.earningsValue}>₹{channel.totalEarnings.toFixed(1)}</Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton} disabled={channel.totalEarnings < 1000}>
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
          <Text style={styles.withdrawInfo}>
            Minimum withdrawal ₹1000 for premium. Non-premium user minimum withdrawal ₹5000
          </Text>
        </View>
      </ScrollView>
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
  settingsButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#000000',
  },
  addImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  channelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  actionIcons: {
    flexDirection: 'row',
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followersText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
    textAlign: 'center',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    width: '100%',
  },
  toggleItem: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    fontSize: 16,
    color: '#666',
  },
  tabActive: {
    fontSize: 16,
    color: '#24d05a',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#24d05a',
    paddingBottom: 5,
  },
  videosSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noVideosText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  earningsSection: {
    padding: 20,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#666',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  withdrawButton: {
    backgroundColor: '#24d05a',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    opacity: 0.5,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  withdrawInfo: {
    fontSize: 12,
    color: '#666',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default MyChannelScreen;