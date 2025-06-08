import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/common/Header'; // Import the Header component

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

interface ExploreItem {
  id: string;
  type: 'post' | 'short';
  imageUrl: string;
  caption: string;
}

const ExploreScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [exploreItems, setExploreItems] = useState<ExploreItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loggedInUserId = 56768; // Replace with actual user ID from auth context
  const limit = 5;

  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://via.placeholder.com/150';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch explore content from API
  const fetchExploreContent = useCallback(async (pageNum: number) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/explore`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          page: pageNum,
          limit,
          loggined_user_id: loggedInUserId,
        }),
      });

      if (!response.ok) {
        console.error('Error fetching explore content:', await response.text());
        setExploreItems([]);
        return;
      }

      const result = await response.json();
      if (result.status && Array.isArray(result.data)) {
        const newItems = result.data.map((item: any) => ({
          id: String(item.id),
          type: item.type as 'post' | 'short',
          imageUrl: getFullImageUrl(item.imageUrl || item.thumbnail),
          caption: item.caption || '',
        }));

        if (newItems.length < limit) {
          setHasMore(false);
        }
        setExploreItems(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      } else {
        setExploreItems([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching explore content:', error);
      setExploreItems([]);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    fetchExploreContent(page);
  }, []);

  const renderItem = useCallback(({ item }: { item: ExploreItem }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          if (item.type === 'post') {
            navigation.navigate('VideoPreview', { postId: item.id });
          } else {
            navigation.navigate('TipShorts', { shortId: item.id });
          }
        }}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: getFullImageUrl(item.imageUrl) }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {item.type === 'short' && (
          <View style={styles.shortIndicator}>
            <Icon name="play-circle" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [navigation]);

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

  const keyExtractor = useCallback((item: ExploreItem) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background}]}>
      <Header title="Explore" />
      
      <FlatList
        data={exploreItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => fetchExploreContent(page)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No content found.
            </Text>
          </View>
        }
        getItemLayout={getItemLayout}
      />
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
  },
});

export default ExploreScreen;