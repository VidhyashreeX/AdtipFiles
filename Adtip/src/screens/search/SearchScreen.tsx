import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface SearchResult {
  id: string;
  title: string;
  type: 'user' | 'content' | 'channel';
  subtitle?: string;
}

const SearchScreen: React.FC = () => {
  const {colors} = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    // Simulate search API call
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Sample User',
          type: 'user',
          subtitle: '@sampleuser',
        },
        {
          id: '2',
          title: 'Sample Content',
          type: 'content',
          subtitle: 'Video content',
        },
        {
          id: '3',
          title: 'Sample Channel',
          type: 'channel',
          subtitle: '1.2K subscribers',
        },
      ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

      setSearchResults(mockResults);
      setIsLoading(false);
    }, 500);
  };

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
      style={[styles.resultItem, {borderBottomColor: colors.border.light}]}>
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

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Search"/>

      <View style={styles.content}>
        <View
          style={[
            styles.searchContainer,
            {backgroundColor: colors.surface, borderColor: colors.border.light},
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
            onChangeText={text => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.clearButton}>
              <Icon name="x" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
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
