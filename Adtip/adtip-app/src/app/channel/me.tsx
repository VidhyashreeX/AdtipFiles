import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Settings, CloudUpload as UploadCloud, User as UserIcon, Phone as PhoneIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import { useUserStore } from '@/store/userStore';
import * as ImagePicker from 'expo-image-picker';

export default function MyChannelScreen() {
  const router = useRouter();
  const { channel, videos, setChannel, toggleCallEnabled } = useUserStore();
  
  const goBack = () => {
    router.back();
  };
  
  const navigateToUpload = () => {
    router.push('/upload');
  };
  
  const navigateToSettings = () => {
    router.push('/channel/settings');
  };

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && channel) {
      const newAvatar = result.assets[0].uri;
      setChannel({ ...channel, avatar: newAvatar });
    }
  };

  const handleToggleCall = () => {
    if (!channel) return;

    toggleCallEnabled();
    // Show pop-up message based on the new state
    const message = channel.isCallEnabled
      ? 'Calls from followers will be denied.'
      : 'You can now receive calls from followers.';
    Alert.alert('Call Status Updated', message, [{ text: 'OK' }]);
  };

  if (!channel) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text>You don't have a channel yet</Text>
        <TouchableOpacity 
          onPress={() => router.push('/channel/create')}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Create Channel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasAvatar = channel.avatar && channel.avatar !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Channel</Text>
        <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
          <Settings size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            {hasAvatar ? (
              <Image 
                source={{ uri: channel.avatar }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={40} color="#666" />
                <Text style={styles.addAvatarText}>Add Avatar</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.channelName}>{channel.name}</Text>
          <Text style={styles.subscriberCount}>{channel.followers} followers</Text>
          
          <Text style={styles.channelDescription}>
            {channel.description || 'No description available'}
          </Text>
          
          <View style={styles.toggleSection}>
            <View style={styles.toggleLabelContainer}>
              <PhoneIcon size={20} color="#388E3C" style={styles.toggleIcon} />
              <Text style={styles.toggleLabel}>Ask Call</Text>
            </View>
            <TouchableOpacity onPress={handleToggleCall}>
              <View style={styles.toggleSwitch}>
                <View
                  style={[
                    styles.toggleActive,
                    channel.isCallEnabled ? styles.toggleActiveOn : styles.toggleActiveOff,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={navigateToUpload}
          >
            <UploadCloud size={20} color="#FFF" />
            <Text style={styles.uploadButtonText}>Upload Video</Text>
          </TouchableOpacity>
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
            <Text style={styles.statValue}>{videos.length}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Shorts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>About</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.videoSection}>
          <Text style={styles.sectionTitle}>Your Videos</Text>
          {videos.length > 0 ? (
            videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>You haven't uploaded any videos yet</Text>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={navigateToUpload}
              >
                <UploadCloud size={20} color="#FFF" />
                <Text style={styles.uploadButtonText}>Upload Your First Video</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.earningSection}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningCard}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Total Earned</Text>
              <Text style={styles.earningValue}>₹0.0</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Available Balance</Text>
              <Text style={styles.earningValue}>₹0.0</Text>
            </View>
            <TouchableOpacity style={styles.withdrawButton}>
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
            <Text style={styles.withdrawalNote}>
              Minimum withdrawal ₹1000 for premium. Non-premium user minimum withdrawal ₹5000
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9', // Changed to light green
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C', // Changed to dark green
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9', // Changed to light green
  },
  avatarContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9', // Changed to light green
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatarText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  channelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388E3C', // Changed to dark green
    marginBottom: 4,
  },
  subscriberCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  channelDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#388E3C', // Changed to dark green
  },
  toggleSwitch: {
    width: 50,
    height: 24,
    backgroundColor: '#E8F5E9', // Changed to light green
    borderRadius: 12,
    padding: 2,
  },
  toggleActive: {
    width: 20,
    height: 20,
    backgroundColor: '#00C853', // Changed to primary green
    borderRadius: 10,
  },
  toggleActiveOn: {
    marginLeft: 24,
  },
  toggleActiveOff: {
    marginLeft: 0,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#00C853', // Changed to primary green
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsSection: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9', // Changed to light green
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C', // Changed to dark green
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9', // Changed to light green
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00C853', // Changed to primary green
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#00C853', // Changed to primary green
    fontWeight: '500',
  },
  videoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C', // Changed to dark green
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  earningSection: {
    padding: 16,
  },
  earningCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  earningLabel: {
    fontSize: 14,
    color: '#333',
  },
  earningValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#388E3C', // Changed to dark green
  },
  withdrawButton: {
    backgroundColor: '#00C853', // Already green, no change needed
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  withdrawButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  withdrawalNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#00C853', // Changed to primary green
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