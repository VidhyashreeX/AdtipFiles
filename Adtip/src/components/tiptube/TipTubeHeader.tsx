import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Share, Cast } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TIPTUBE_THEME, createTipTubeStyles } from '../../utils/tiptubeTheme';

interface TipTubeHeaderProps {
  onSearchPress?: () => void;
  onProfilePress?: () => void;
  onSharePress?: () => void;
  onCastPress?: () => void;
}

const TipTubeHeader: React.FC<TipTubeHeaderProps> = ({
  onSearchPress,
  onProfilePress,
  onSharePress,
  onCastPress,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user, isGuest } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isToggleOn, setIsToggleOn] = useState(false);

  const baseStyles = createTipTubeStyles(colors, isDarkMode);
  const styles = createStyles(colors, isDarkMode, insets.top);

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else if (!isGuest) {
      navigation.navigate('Profile' as never);
    }
  };

  const handleSharePress = () => {
    if (onSharePress) {
      onSharePress();
    }
  };

  const handleCastPress = () => {
    if (onCastPress) {
      onCastPress();
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left side - Logo and Toggle */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Tiptube</Text>
            <Switch
              trackColor={{ false: '#767577', true: TIPTUBE_THEME.colors.secondary }}
              thumbColor={isToggleOn ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setIsToggleOn}
              value={isToggleOn}
              style={styles.toggleSwitch}
            />
          </View>
        </View>

        {/* Right side - Icons */}
        <View style={styles.rightSection}>
          {/* Share Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSharePress}
            activeOpacity={0.7}
          >
            <Share size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Cast Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleCastPress}
            activeOpacity={0.7}
          >
            <Cast size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Search Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSearchPress}
            activeOpacity={0.7}
          >
            <Icon name="search" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            {!isGuest && user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Icon name="user" size={20} color={colors.text.secondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean, topInset: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingTop: topInset,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: TIPTUBE_THEME.spacing.lg,
      paddingVertical: TIPTUBE_THEME.spacing.md,
      height: TIPTUBE_THEME.dimensions.headerHeight,
    },
    leftSection: {
      flex: 1,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoText: {
      ...TIPTUBE_THEME.typography.h2,
      color: colors.text.primary,
      marginRight: TIPTUBE_THEME.spacing.sm,
    },
    toggleSwitch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileButton: {
      padding: 4,
    },
    profileImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
    },
    defaultAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default TipTubeHeader;
