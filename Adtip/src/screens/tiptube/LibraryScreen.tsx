import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Tv, Upload, BarChart3, Users, Bell, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChannelData } from '../../hooks/useQueries';
import Header from '../../components/common/Header';
import ContentCreatorPlanToggle from '../../components/common/ContentCreatorPlanToggle';
import { useGuestGuard } from '../../hooks/useGuestGuard';

interface LibraryMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  showChevron?: boolean;
}

const LibraryScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const styles = createStyles(colors, isDarkMode, insets.top);

  // Fetch user's channel data to get channelId
  const {
    data: channelData,
    isLoading: channelLoading,
    error: channelError
  } = useChannelData(user?.id || 0);

  // Get the channelId from the fetched data
  const userChannelId = channelData?.data?.[0]?.channelId;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAnalyticsPress = () => {
    if (userChannelId) {
      navigation.navigate('Analytics' as never, { channelId: String(userChannelId) });
    } else {
      // If no channel found, navigate to create channel
      navigation.navigate('CreateChannel' as never);
    }
  };

  const handleUploadVideoPress = () => {
    // Navigate to TipTubeUpload screen (same as YourChannelScreen)
    navigation.navigate('TipTubeUpload' as never);
  };

  const handleEarnMoneyPress = () => {
    // Navigate to EarnMoneyCreator to show earning opportunities
    navigation.navigate('EarnMoneyCreator' as never);
  };

  // Guest guard hook
  const { requireAuth } = useGuestGuard();

  // Content Creator Premium Toggle Handler
  const handleTogglePremium = () => {
    requireAuth('premium', () => {
      console.log('🚀 [LibraryScreen] User clicked content creator premium toggle');
      navigation.navigate('ContentCreatorPremium' as never);
    });
  };

  const menuItems: LibraryMenuItem[] = [
    {
      id: 'your-channel',
      title: 'Your Tiptube Channel',
      icon: <Tv size={24} color={colors.text.primary} />,
      onPress: () => navigation.navigate('YourChannel' as never),
      showChevron: true,
    },
    {
      id: 'upload-videos',
      title: 'Upload Videos',
      icon: <Upload size={24} color={colors.text.primary} />,
      onPress: handleUploadVideoPress,
      showChevron: true,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart3 size={24} color={colors.text.primary} />,
      onPress: handleAnalyticsPress,
      showChevron: true,
    },
    {
      id: 'followed-channel',
      title: 'Followed Channel',
      icon: <Users size={24} color={colors.text.primary} />,
      onPress: () => navigation.navigate('FollowedChannel' as never),
      showChevron: true,
    },
    {
      id: 'notification',
      title: 'Notification',
      icon: <Bell size={24} color={colors.text.primary} />,
      onPress: () => navigation.navigate('Notifications' as never),
      showChevron: true,
    },
    {
      id: 'earn-money',
      title: 'How to earn money as a content creator',
      icon: <DollarSign size={24} color={colors.text.primary} />,
      onPress: handleEarnMoneyPress,
      showChevron: true,
    },
  ];

  const renderMenuItem = (item: LibraryMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            {item.icon}
          </View>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
        </View>
        
        {item.showChevron && (
          <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Standardized Header */}
      <Header
        title="Library"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          <ContentCreatorPlanToggle onPress={handleTogglePremium} />
        }
      />

      {/* Menu Items */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>
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
    backButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    menuContainer: {
      paddingTop: 8,
    },
    menuItem: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.primary,
      flex: 1,
    },
  });

export default LibraryScreen;
