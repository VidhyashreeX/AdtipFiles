import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { FeedFlatList } from '../common/OptimizedFlatList';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import {
  useShortsInfiniteQuery,
  useGuestShortsQuery,
  type ShortVideo as TanStackShortVideo
} from '../../hooks/useShortsQuery';
import { getSecureMediaUrl, getFallbackThumbnailUrl } from '../../utils/mediaUtils';
import { ThumbnailFastImage } from '../../utils/FastImageOptimizer';

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
    // Use useMemo to ensure fallback URL is stable and doesn't change on every render
    const fallbackUrl = React.useMemo(() => getFallbackThumbnailUrl(item.id), [item.id]);
    const [thumbnailUrl, setThumbnailUrl] = React.useState<string>(fallbackUrl);
    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
      const loadThumbnail = async () => {
        if (item.thumbnail) {
          try {
            setIsLoading(true);
            const secureUrl = await getSecureMediaUrl(item.thumbnail);
            if (secureUrl) {
              console.log('[TipShortsSection] Loaded secure thumbnail URL for short:', item.id);
              setThumbnailUrl(secureUrl);
            } else {
              console.warn('[TipShortsSection] No secure URL returned, using fallback');
              setThumbnailUrl(fallbackUrl);
            }
          } catch (error) {
            console.warn('[TipShortsSection] Failed to load thumbnail:', error);
            // Reset to stable fallback URL
            setThumbnailUrl(fallbackUrl);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      };

      loadThumbnail();
    }, [item.thumbnail, fallbackUrl]);

    return (
      <TouchableOpacity
        style={styles.shortCard}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <ThumbnailFastImage
          source={{ uri: thumbnailUrl }}
          style={styles.shortThumbnail}
          resizeMode="cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            console.warn('[TipShortsSection] Image failed to load, using fallback for short:', item.id);
            setThumbnailUrl(fallbackUrl);
            setIsLoading(false);
          }}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}

        {/* Play indicator for shorts - matching explore screen design */}
        <View style={styles.shortIndicator}>
          <Icon name="play-circle" size={20} color="#fff" />
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
        <FeedFlatList
          data={displayShorts}
          renderItem={renderShortCard}
          idField="id"
          debugName="TipShortsHorizontal"
          horizontal={true}
          customOptimizations={{
            removeClippedSubviews: true,
            initialNumToRender: 4,
            maxToRenderPerBatch: 3,
            windowSize: 6,
            showsHorizontalScrollIndicator: false,
          }}
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
    shortIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      padding: 4,
    },
    loadingIndicator: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12 }, { translateY: -12 }],
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      padding: 4,
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
