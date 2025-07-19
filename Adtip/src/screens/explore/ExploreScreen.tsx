import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useExplore } from '../../hooks/useQueries';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';
import { ExploreItem } from '../../types/api';
import { ThumbnailFastImage } from '../../utils/FastImageOptimizer';
import { createOptimizedFlatListProps, createKeyExtractor, createGridLayout } from '../../utils/PerformanceUtils';
import Icon from 'react-native-vector-icons/Feather';
import { API_BASE_URL } from '../../constants/api';

// Constants
const GRID_SPACING = 2;
const ITEMS_PER_ROW = 3;

const ExploreScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const loggedInUserId = user?.id || 56768; // Use actual user ID or fallback

  // Use the explore hook with React Query
  const {
    data,
    isLoading: loading,
    isFetchingNextPage: isLoadingMore,
    error,
    hasNextPage: hasMore,
    refetch: refresh,
    fetchNextPage: loadMore,
  } = useExplore(loggedInUserId);

  // Flatten the paginated data
  const exploreItems = useMemo(() => {
    return data?.pages?.flatMap(page => page.data) || [];
  }, [data]);

  // Helper function for full image URLs
  const getFullImageUrl = useCallback((url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://via.placeholder.com/150';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  const renderItem = useCallback(({ item, index }: { item: ExploreItem, index: number }) => {
    const imageUrl = item.content_type === 'post' ? item.media_url : item.thumbnail;

    const handleItemPress = () => {
      if (item.content_type === 'post') {
        // Navigate directly to PostViewerScreen with postId param
        navigation.navigate('PostViewer', { postId: item.id });
      } else if (item.content_type === 'shot') {
        // Map ExploreItem to ShortVideo shape for TipShorts
        const mappedShort = {
          id: item.id.toString(),
          title: item.title || '',
          thumbnail: item.thumbnail || item.media_url || null,
          channel: {
            id: (item.channelId || item.user_id || item.id).toString(),
            name: item.user_name || item.name || '',
            avatar: item.user_profile_image || '',
            verified: false,
            subscribers: 0,
          },
          views: item.total_views || 0,
          likes: item.total_likes || item.likeCount || 0,
          duration: '',
          createdAt: '',
          category: '',
          isPaidPromotional: false,
          postedAt: '',
          description: item.content || '',
          videoUrl: typeof item.media_url === 'string' ? item.media_url : '',
          comments: item.total_comments || item.commentCount || 0,
          musicName: '',
          isLiked: item.is_liked || false,
        };
        navigation.navigate('TipShorts', {
          shorts: [mappedShort],
          startIndex: 0,
          shortId: mappedShort.id,
        });
      } else {
        console.warn('[ExploreScreen] Unknown content type:', item.content_type);
      }
    };

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={handleItemPress}
        activeOpacity={0.8}
      >
        <ThumbnailFastImage
          source={getFullImageUrl(imageUrl)}
          style={styles.itemImage}
        />
        {item.content_type === 'shot' && (
          <View style={styles.shortIndicator}>
            <Icon name="play-circle" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [navigation, getFullImageUrl]);

  // Memoized item layout for better scrolling performance
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const itemSize = width / 3;
      return {
        length: itemSize,
        offset: itemSize * index,
        index,
      };
    },
    [width]
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: ExploreItem) => item.id.toString(), []);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Loading skeleton component
  const renderLoadingSkeleton = useMemo(() => (
    <FlatList
      data={Array(12).fill(null)} // Show 4 rows of 3 items = 12 skeletons
      numColumns={3}
      key="skeleton-grid-3" // Force re-render when numColumns changes
      keyExtractor={(_, index) => `skeleton-${index}`}
      renderItem={() => (
        <View style={[styles.itemContainer, { backgroundColor: colors.surface }]}>
          <PostItemSkeleton />
        </View>
      )}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent}
    />
  ), [colors.surface]);

  // Error component
  const renderError = useMemo(() => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={48} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.text.secondary }]}>
        Failed to load content
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefresh}
      >
        <Text style={[styles.retryButtonText, { color: colors.white }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  ), [colors, handleRefresh]);

  // Empty state component
  const renderEmptyState = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Icon name="search" size={48} color={colors.text.tertiary} />
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        No content found
      </Text>
    </View>
  ), [colors]);

  // Optimized FlatList props
  const optimizedFlatListProps = useMemo(() =>
    createOptimizedFlatListProps('GRID', {
      data: exploreItems,
      renderItem,
      keyExtractor,
      numColumns: ITEMS_PER_ROW,
      key: `explore-grid-${ITEMS_PER_ROW}`, // Force re-render when numColumns changes
      columnWrapperStyle: styles.row,
      contentContainerStyle: styles.listContent,
      showsVerticalScrollIndicator: false,
      onEndReached: handleLoadMore,
      onEndReachedThreshold: 0.5,
      ListFooterComponent: isLoadingMore ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null,
      ListEmptyComponent: renderEmptyState,
      getItemLayout: getItemLayout,
    }), [exploreItems, renderItem, keyExtractor, handleLoadMore, isLoadingMore, colors, renderEmptyState, getItemLayout]);

  if (loading && exploreItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderLoadingSkeleton}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderError}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList {...optimizedFlatListProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    flex: 1,
    margin: GRID_SPACING,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
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
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default React.memo(ExploreScreen);