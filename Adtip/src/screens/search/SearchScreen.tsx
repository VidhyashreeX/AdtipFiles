import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,

} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import {useSearchUsers} from '../../hooks/useQueries';
import {useAuth} from '../../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {getUserProfileColor, getInitials} from '../../utils/colorUtils';
import {API_BASE_URL} from '../../constants/api';


interface User {
  id: number;
  name: string;
  profile_image: string | null;
}

const SearchScreen: React.FC = () => {
  const {colors} = useTheme();
  const {user} = useAuth();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  // Removed modal states - now using direct navigation to Profile screen

  // TanStack Query hooks
  const userSearchQuery = useSearchUsers(debouncedQuery, page, 20);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to first page when search query changes
      setHasMore(true); // Reset hasMore when search query changes
      setAllUsers([]); // Clear all users when search query changes
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Update hasMore and accumulate users based on search results
  useEffect(() => {
    if (userSearchQuery.data?.data?.users) {
      const users = userSearchQuery.data.data.users;
      const pagination = userSearchQuery.data.data.pagination;

      console.log('[SearchScreen] Search results:', {
        query: debouncedQuery,
        usersCount: users.length,
        pagination,
        page,
        status: userSearchQuery.data.status
      });

      // Use the pagination data from API response
      setHasMore(pagination?.has_next || false);

      // Accumulate users for pagination
      if (page === 1) {
        setAllUsers(users);
      } else {
        setAllUsers(prev => [...prev, ...users]);
      }
    } else if (userSearchQuery.data && !userSearchQuery.data.status) {
      // Handle API error responses
      console.warn('[SearchScreen] Search API returned error:', userSearchQuery.data.message);
      setAllUsers([]);
      setHasMore(false);
    }
  }, [userSearchQuery.data, page, debouncedQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
    setAllUsers([]);
  }, []);

  const loadMoreUsers = useCallback(() => {
    if (hasMore && !userSearchQuery.isFetching) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, userSearchQuery.isFetching]);

  const handleUserPress = useCallback((userId: number) => {
    console.log('[SearchScreen] Navigating to Profile with userId:', userId);
    // Navigate directly to Profile screen instead of using modal
    (navigation as any).navigate('Profile', { userId });
  }, [navigation]);

  const getFullImageUrl = (url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderUserItem = ({item}: {item: User}) => {
    return (
      <TouchableOpacity
        style={[styles.userItem, {borderBottomColor: colors.border}]}
        onPress={() => handleUserPress(item.id)}>
        <View style={styles.userProfileContainer}>
          {item.profile_image ? (
            <Image
              source={{ uri: getFullImageUrl(item.profile_image) || undefined }}
              style={styles.userProfileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.userProfilePlaceholder, { backgroundColor: getUserProfileColor(item.id) }]}>
              <Text style={styles.userProfileInitials}>{getInitials(item.name)}</Text>
            </View>
          )}
        </View>
        <View style={styles.userContent}>
          <Text style={[styles.userName, {color: colors.text.primary}]}>
            {item.name || 'Unknown User'}
          </Text>
          <Text style={[styles.userSubtitle, {color: colors.text.secondary}]}>
            User
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingMoreText, {color: colors.text.secondary}]}>
          Loading more users...
        </Text>
      </View>
    );
  };

  const isSearching = userSearchQuery.isFetching;
  const users = allUsers;

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Search"/>

      <View style={styles.content}>
        <View
          style={[
            styles.searchContainer,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}>
          <Icon
            name="search"
            size={20}
            color={colors.text.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, {color: colors.text.primary}]}
            placeholder="Search users..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearButton}>
              <Icon name="x" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.text.secondary}]}>
              Searching...
            </Text>
          </View>
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => `user-${item.id}`}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreUsers}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
          />
        ) : userSearchQuery.isError ? (
          <View style={styles.noResultsContainer}>
            <Icon name="alert-circle" size={48} color={colors.error} />
            <Text
              style={[styles.noResultsText, {color: colors.text.secondary}]}>
              Search failed. Please check your connection and try again.
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => userSearchQuery.refetch()}>
              <Text style={[styles.retryButtonText, { color: colors.surface }]}>
                Retry Search
              </Text>
            </TouchableOpacity>
          </View>
        ) : searchQuery.length > 0 ? (
          <View style={styles.noResultsContainer}>
            <Icon name="search" size={48} color={colors.text.tertiary} />
            <Text
              style={[styles.noResultsText, {color: colors.text.secondary}]}>
              No users found for "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, {color: colors.text.secondary}]}>
              Search for users
            </Text>
          </View>
        )}

        {/* Removed User Profile Modal - now using direct navigation */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userProfileContainer: {
    marginRight: 12,
  },
  userProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userProfileInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    marginTop: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 16,
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
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default SearchScreen;
