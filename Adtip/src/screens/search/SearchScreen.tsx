import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import {useUserSearch, useContentSearch, useSaveSearchHistory} from '../../hooks/useQueries';
import {useAuth} from '../../contexts/AuthContext';

interface SearchResult {
  id: string;
  title: string;
  type: 'user' | 'content' | 'channel';
  subtitle?: string;
  data?: any;
}

const SearchScreen: React.FC = () => {
  const {colors} = useTheme();
  const {user} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'user' | 'content'>('user');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // TanStack Query hooks
  const userSearchQuery = useUserSearch(debouncedQuery, {}, user?.id || 0);
  const contentSearchQuery = useContentSearch(debouncedQuery, {}, user?.id || 0);
  const saveSearchHistoryMutation = useSaveSearchHistory();

  // Debounce search query
  const debounceSearch = useCallback((query: string) => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      debounceSearch(query);
      // Save search history
      saveSearchHistoryMutation.mutate({
        userId: user?.id || 0,
        query: query.trim(),
        type: searchType
      });
    }
  }, [debounceSearch, saveSearchHistoryMutation, user?.id, searchType]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Get current search results based on type
  const getCurrentResults = () => {
    if (searchType === 'user') {
      return userSearchQuery.data?.pages?.flatMap(page => 
        page?.data?.map((user: any) => ({
          id: user.id?.toString() || '',
          title: user.name || user.username || 'Unknown User',
          type: 'user' as const,
          subtitle: `@${user.username || 'user'}`,
          data: user
        })) || []
      ) || [];
    } else {
      return contentSearchQuery.data?.pages?.flatMap(page => 
        page?.data?.map((content: any) => ({
          id: content.id?.toString() || '',
          title: content.title || content.name || 'Untitled Content',
          type: 'content' as const,
          subtitle: content.description || 'Content',
          data: content
        })) || []
      ) || [];
    }
  };

  const isSearching = userSearchQuery.isFetching || contentSearchQuery.isFetching;
  const searchResults = getCurrentResults();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return 'user';
      case 'content':
        return 'video';
      case 'channel':
        return 'tv';
      default:
        return 'search';
    }
  };

  const renderSearchResult = ({item}: {item: SearchResult}) => (
    <TouchableOpacity
      style={[styles.resultItem, {borderBottomColor: colors.border}]}>
      <Icon
        name={getTypeIcon(item.type)}
        size={20}
        color={colors.text.secondary}
        style={styles.resultIcon}
      />
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, {color: colors.text.primary}]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.resultSubtitle, {color: colors.text.secondary}]}>
            {item.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSearchTypeToggle = () => (
    <View style={styles.searchTypeContainer}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          searchType === 'user' && {backgroundColor: colors.primary}
        ]}
        onPress={() => setSearchType('user')}>
        <Text style={[
          styles.typeButtonText,
          {color: searchType === 'user' ? colors.white : colors.text.primary}
        ]}>
          Users
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.typeButton,
          searchType === 'content' && {backgroundColor: colors.primary}
        ]}
        onPress={() => setSearchType('content')}>
        <Text style={[
          styles.typeButtonText,
          {color: searchType === 'content' ? colors.white : colors.text.primary}
        ]}>
          Content
        </Text>
      </TouchableOpacity>
    </View>
  );

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
            placeholder="Search users, content, channels..."
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

        {searchQuery.length > 0 && renderSearchTypeToggle()}

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.text.secondary}]}>
              Searching...
            </Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (searchType === 'user') {
                userSearchQuery.fetchNextPage();
              } else {
                contentSearchQuery.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() => 
              (userSearchQuery.isFetchingNextPage || contentSearchQuery.isFetchingNextPage) ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingMoreText, {color: colors.text.secondary}]}>
                    Loading more...
                  </Text>
                </View>
              ) : null
            }
          />
        ) : searchQuery.length > 0 ? (
          <View style={styles.noResultsContainer}>
            <Icon name="search" size={48} color={colors.text.tertiary} />
            <Text
              style={[styles.noResultsText, {color: colors.text.secondary}]}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, {color: colors.text.secondary}]}>
              Search for users, content, and channels
            </Text>
          </View>
        )}
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
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultIcon: {
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultSubtitle: {
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
