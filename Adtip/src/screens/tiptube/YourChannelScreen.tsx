import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Star, Edit, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TipTubeHeader from '../../components/tiptube/TipTubeHeader';

interface ChannelVideo {
  id: number;
  title: string;
  thumbnail: string;
  views: number;
  duration: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 videos per row
const VIDEO_CARD_HEIGHT = VIDEO_CARD_WIDTH * 0.6; // 16:10 aspect ratio

// Mock data for demonstration
const mockVideos: ChannelVideo[] = [
  {
    id: 1,
    title: 'Cartoon Serial Part 2',
    thumbnail: 'https://picsum.photos/300/180?random=1',
    views: 1200,
    duration: '12:01:00',
  },
  {
    id: 2,
    title: 'Comedy Show Episode 5',
    thumbnail: 'https://picsum.photos/300/180?random=2',
    views: 850,
    duration: '8:45:00',
  },
  {
    id: 3,
    title: 'Tutorial Series Part 1',
    thumbnail: 'https://picsum.photos/300/180?random=3',
    views: 2100,
    duration: '15:30:00',
  },
  {
    id: 4,
    title: 'Live Stream Highlights',
    thumbnail: 'https://picsum.photos/300/180?random=4',
    views: 950,
    duration: '6:20:00',
  },
];

const YourChannelScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('Home');

  const styles = createStyles(colors, isDarkMode, insets.top);

  const tabs = ['Home', 'InShorts', 'Products'];

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleVideoManagement = () => {
    // Navigate to video management screen
    navigation.navigate('VideoManagement' as never);
  };

  const handleEditChannel = () => {
    // Navigate to edit channel screen
    navigation.navigate('EditChannel' as never);
  };

  const handleAnalytics = () => {
    // Navigate to analytics screen
    navigation.navigate('Analytics' as never);
  };

  const renderVideoCard = ({ item }: { item: ChannelVideo }) => (
    <TouchableOpacity style={styles.videoCard} activeOpacity={0.9}>
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.videoThumbnail}
        resizeMode="cover"
      />
      <View style={styles.videoDurationOverlay}>
        <Text style={styles.videoDurationText}>{item.duration}</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.videoViews}>
          {formatViewCount(item.views)} views
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Home':
        return (
          <FlatList
            data={mockVideos}
            renderItem={renderVideoCard}
            keyExtractor={(item) => `video-${item.id}`}
            numColumns={2}
            ItemSeparatorComponent={() => <View style={styles.videoSeparator} />}
            columnWrapperStyle={styles.videoRow}
            contentContainerStyle={styles.videoGrid}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'InShorts':
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No shorts available</Text>
          </View>
        );
      case 'Products':
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products available</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Channel</Text>
        <View style={styles.headerToggle}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTrack} />
            <View style={styles.toggleThumb} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: user?.profile_image || 'https://via.placeholder.com/100',
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{user?.name || 'Jarad Dugley'}</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>200</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1,920</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          {/* Video Management Button */}
          <TouchableOpacity
            style={styles.videoManagementButton}
            onPress={handleVideoManagement}
            activeOpacity={0.8}
          >
            <Text style={styles.videoManagementText}>Video Management</Text>
          </TouchableOpacity>

          {/* Action Icons */}
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.actionIcon} onPress={handleEditChannel}>
              <Star size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={handleEditChannel}>
              <Edit size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={handleAnalytics}>
              <BarChart3 size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.selectedTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerToggle: {
      width: 40,
      alignItems: 'flex-end',
    },
    toggleContainer: {
      width: 32,
      height: 18,
      position: 'relative',
    },
    toggleTrack: {
      width: '100%',
      height: '100%',
      backgroundColor: '#ff4444',
      borderRadius: 9,
    },
    toggleThumb: {
      position: 'absolute',
      right: 2,
      top: 2,
      width: 14,
      height: 14,
      backgroundColor: '#FFFFFF',
      borderRadius: 7,
    },
    content: {
      flex: 1,
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    statItem: {
      alignItems: 'center',
      marginHorizontal: 24,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    statLabel: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 2,
    },
    videoManagementButton: {
      backgroundColor: '#00C853',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      marginBottom: 16,
    },
    videoManagementText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    actionIcons: {
      flexDirection: 'row',
      gap: 16,
    },
    actionIcon: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.cardSecondary,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    selectedTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#00C853',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    selectedTabText: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    videoGrid: {
      padding: 16,
    },
    videoRow: {
      justifyContent: 'space-between',
    },
    videoSeparator: {
      height: 16,
    },
    videoCard: {
      width: VIDEO_CARD_WIDTH,
      backgroundColor: colors.cardSecondary,
      borderRadius: 8,
      overflow: 'hidden',
    },
    videoThumbnail: {
      width: '100%',
      height: VIDEO_CARD_HEIGHT,
      backgroundColor: colors.border,
    },
    videoDurationOverlay: {
      position: 'absolute',
      bottom: VIDEO_CARD_HEIGHT - 20,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    videoDurationText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    videoInfo: {
      padding: 8,
    },
    videoTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: 4,
    },
    videoViews: {
      fontSize: 11,
      color: colors.text.tertiary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text.secondary,
    },
  });

export default YourChannelScreen;
