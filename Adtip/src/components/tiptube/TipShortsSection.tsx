import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import {
  useShortsInfiniteQuery,
  useGuestShortsQuery,
  type ShortVideo as TanStackShortVideo
} from '../../hooks/useShortsQuery';
import { getSecureMediaUrl, getFallbackThumbnailUrl } from '../../utils/mediaUtils';

// Use the same type as TipShortsEnhanced
type ShortVideo = TanStackShortVideo;

interface TipShortsSectionProps {
  onSeeAllPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 120; // Fixed width for horizontal scrolling
const CARD_HEIGHT = CARD_WIDTH * 1.5; // Vertical aspect ratio for shorts

const TipShortsSection: React.FC<TipShortsSectionProps> = ({
  onSeeAllPress,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const { user, isGuest } = useAuth();
  const styles = createStyles(colors, isDarkMode);

  // Use the same API hooks as TipShortsEnhanced
  const authenticatedShortsQuery = useShortsInfiniteQuery(user?.id?.toString() || '50816');
  const guestShortsQuery = useGuestShortsQuery();

  // Choose the appropriate query based on guest mode
  const {
    data,
    isLoading,
    error,
  } = isGuest ? {
    data: guestShortsQuery.data,
    isLoading: guestShortsQuery.isLoading,
    error: guestShortsQuery.error,
  } : authenticatedShortsQuery;

  // Extract shorts from the data structure
  const shorts: ShortVideo[] = React.useMemo(() => {
    if (!data) return [];

    if (isGuest) {
      // Guest data structure
      return data.pages?.[0]?.data || [];
    } else {
      // Authenticated data structure - flatten all pages
      return data.pages?.flatMap(page => page || []) || [];
    }
  }, [data, isGuest]);

  // Take only first 6 shorts for the horizontal section
  const displayShorts = shorts.slice(0, 6);

  const handleSeeAllPress = () => {
    if (onSeeAllPress) {
      onSeeAllPress();
    } else {
      navigation.navigate('TipShorts' as never);
    }
  };

  const handleShortPress = (short: ShortVideo) => {
    // Navigate to TipShorts with specific video
    navigation.navigate('TipShorts' as never, { videoId: short.id });
  };

  // Separate component for short card to properly use hooks
  const ShortCard = React.memo(({ item, onPress }: { item: ShortVideo; onPress: (item: ShortVideo) => void }) => {
    const [thumbnailUrl, setThumbnailUrl] = React.useState<string>(getFallbackThumbnailUrl());

    React.useEffect(() => {
      const loadThumbnail = async () => {
        if (item.thumbnail) {
          try {
            const secureUrl = await getSecureMediaUrl(item.thumbnail);
            if (secureUrl) {
              setThumbnailUrl(secureUrl);
            }
          } catch (error) {
            console.warn('[TipShortsSection] Failed to load thumbnail:', error);
            // Keep fallback URL
          }
        }
      };

      loadThumbnail();
    }, [item.thumbnail]);

    return (
      <TouchableOpacity
        style={styles.shortCard}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.shortThumbnail}
          resizeMode="cover"
          onError={() => {
            // Fallback to placeholder on error
            setThumbnailUrl(getFallbackThumbnailUrl());
          }}
        />

        {/* Overlay Content */}
        <View style={styles.shortOverlay}>
          <View style={styles.shortContent}>
            <Text style={styles.shortTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.shortCreator}>
              {item.channel.name}
            </Text>
            <Text style={styles.shortViews}>
              {item.views.toLocaleString()} views
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const renderShortCard = ({ item }: { item: ShortVideo }) => (
    <ShortCard item={item} onPress={handleShortPress} />
  );

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Tipshorts</Text>
        <TouchableOpacity onPress={handleSeeAllPress} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Shorts Horizontal List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading shorts...
          </Text>
        </View>
      ) : displayShorts.length > 0 ? (
        <FlatList
          data={displayShorts}
          renderItem={renderShortCard}
          keyExtractor={(item) => `short-${item.id}`}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
          contentContainerStyle={styles.horizontalContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No shorts available
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingVertical: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#00C853',
    },
    horizontalContent: {
      paddingHorizontal: 16,
    },
    horizontalSeparator: {
      width: 12,
    },
    shortCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.border,
      position: 'relative',
    },
    shortThumbnail: {
      width: '100%',
      height: '100%',
    },
    shortOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: 12,
    },
    shortContent: {
      justifyContent: 'flex-end',
    },
    shortTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    shortCreator: {
      color: '#FFFFFF',
      fontSize: 12,
      opacity: 0.9,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      marginBottom: 2,
    },
    shortViews: {
      color: '#FFFFFF',
      fontSize: 11,
      opacity: 0.8,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
  });

export default TipShortsSection;
