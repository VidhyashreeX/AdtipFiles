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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LibraryMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  showChevron?: boolean;
}

const LibraryScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const styles = createStyles(colors, isDarkMode, insets.top);

  const handleBackPress = () => {
    navigation.goBack();
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
      onPress: () => navigation.navigate('UploadVideo' as never),
      showChevron: true,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart3 size={24} color={colors.text.primary} />,
      onPress: () => navigation.navigate('Analytics' as never),
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
      id: 'paid-video-analytics',
      title: 'Paid Video Analytics',
      icon: <DollarSign size={24} color={colors.text.primary} />,
      onPress: () => navigation.navigate('PaidVideoAnalytics' as never),
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={styles.headerSpacer} />
      </View>

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
    headerSpacer: {
      width: 40, // Same width as back button for centering
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
