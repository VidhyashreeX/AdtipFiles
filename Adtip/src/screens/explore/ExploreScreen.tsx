import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/common/Header';
import { useExplore } from '../../hooks/useQueries';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';
import { ExploreItem } from '../../types/api';

// Constants
const API_BASE_URL = 'https://api.adtip.in';

// Define navigation param list
type RootStackParamList = {
  VideoPreview: { postId: string };
  TipShorts: { shortId: string };
  Explore: undefined;
};

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExploreScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
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

  // Memoized render item for better performance
  const renderItem = useCallback(({ item, index }: { item: ExploreItem, index: number }) => {
    const imageUrl = item.content_type === 'post' ? item.media_url : item.thumbnail;
    
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          if (item.content_type === 'post') {
            navigation.navigate('VideoPreview', { postId: item.id.toString() });
          } else {
            // Filter only for shorts and map to the expected format
            const shortsOnly = exploreItems
              .filter(i => i.content_type === 'shot')
              .map(i => ({
                id: i.id.toString(),
                videoUrl: getFullImageUrl(i.media_url),
                // Add other required fields for ShortVideo type, possibly with fallbacks
                title: i.title || 'Untitled Short',
                thumbnail: getFullImageUrl(i.thumbnail),
                channel: {
                  id: i.channel_id?.toString() || 'unknown',
                  name: i.channel_name || 'Unknown Channel',
                  avatar: getFullImageUrl(i.channel_avatar),
                  verified: false,
                  subscribers: 0,
                },
                views: i.views || 0,
                likes: i.likes || 0,
                duration: '0:00',
                createdAt: new Date().toISOString(),
                category: '1',
                postedAt: new Date().toISOString(),
                description: i.title || '',
                comments: 0,
              }));
            
            const selectedShortIndex = shortsOnly.findIndex(s => s.id === item.id.toString());

            navigation.navigate('TipShorts', { 
              shorts: shortsOnly,
              startIndex: selectedShortIndex,
            });
          }
        }}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: getFullImageUrl(imageUrl) }}
          style={styles.itemImage}
          resizeMode="cover"
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

  // Empty state component
  const renderEmptyState = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Icon name="search" size={48} color={colors.text.secondary} />
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        {error ? 'Failed to load content' : 'No content found'}
      </Text>
      {error && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [colors, error, handleRefresh]);

  // Network status indicator - simplified since React Query handles offline/online
  const NetworkIndicator = useMemo(() => {
    // You can add network status checking here if needed
    return null;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background}]}>
      <Header
        title="Explore"
        showWallet={false}
        showSearch={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      {NetworkIndicator}
      
      {loading && exploreItems.length === 0 ? (
        renderLoadingSkeleton
      ) : (
        <FlatList
          data={exploreItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={loading && exploreItems.length > 0}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={9}
          windowSize={5}
          initialNumToRender={9}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 2,
  },
  itemContainer: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  shortIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  networkText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default ExploreScreen;