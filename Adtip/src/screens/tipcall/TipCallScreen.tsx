// src/screens/tipcall/TipCallScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import Header from '../../components/common/Header';

// Context
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';

// Constants
import {API_BASE_URL, API_ENDPOINTS} from '../../constants/api';

// Types
interface TipCallScreenProps {
  walletBalance?: string; // Optional wallet balance coming from HOC
}

interface TipCallUser {
  id: number;
  name: string;
  profile_image: string | null;
  is_online: boolean;
  rating: number;
  calling_rate: string;
  expertise: string[];
  tags: string[];
  is_available: boolean;
}

const TipCallScreen: React.FC<TipCallScreenProps> = ({walletBalance}) => {
  // Hooks
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'available' | 'all'>('available');
  const [users, setUsers] = useState<TipCallUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper functions
  const getFullImageUrl = (url?: string | null) => {
    if (!url || url === 'null' || url === 'undefined') {
      return null;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // API calls
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.USERS.GET_ALL_USERS}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result?.data && Array.isArray(result.data)) {
        // Transform the data into the format we need
        const callingUsers = result.data
          .filter((u: any) => u.id !== user?.id) // Filter out the current user
          .map((u: any) => ({
            id: u.id,
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            profile_image: getFullImageUrl(u.profile_image),
            is_online: u.online_status === true || u.online_status === 1,
            rating: 4 + Math.random(), // Random rating between 4 and 5
            calling_rate: (Math.floor(Math.random() * 10) + 5).toString(), // Random rate between $5-$15
            expertise: ['Fashion', 'Lifestyle', 'Technology'].slice(
              0,
              Math.floor(Math.random() * 3) + 1,
            ),
            tags: ['Friendly', 'Expert', 'Fast Responder'].slice(
              0,
              Math.floor(Math.random() * 3) + 1,
            ),
            is_available: u.is_available === true || u.is_available === 1,
          }));

        setUsers(callingUsers);
        setError(null);
      } else {
        setUsers([]);
        setError('No users available for calls at the moment.');
      }
    } catch (err) {
      console.error('Users fetch error:', err);
      setError('Failed to load call users. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCallUser = (userId: number) => {
    // Navigate to call screen
    // @ts-ignore
    navigation.navigate('Call', {userId});
  };

  const handleUserProfile = (userId: number) => {
    // Navigate to user profile
    // @ts-ignore
    navigation.navigate('Profile', {userId});
  };

  const handleTabChange = (tab: 'available' | 'all') => {
    setActiveTab(tab);
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers]),
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on active tab
  const filteredUsers =
    activeTab === 'available' ? users.filter(u => u.is_available) : users;

  // Render functions
  const renderUserItem = ({item}: {item: TipCallUser}) => (
    <TouchableOpacity
      style={[styles.userCard, {backgroundColor: colors.white}]}
      onPress={() => handleUserProfile(item.id)}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.profile_image ? (
              <Image source={{uri: item.profile_image}} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {backgroundColor: colors.gray[200]},
                ]}
              />
            )}
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: item.is_online
                    ? colors.success
                    : colors.gray[400],
                },
              ]}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, {color: colors.text.primary}]}>
              {item.name}
            </Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, {color: colors.text.secondary}]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.rate, {color: colors.primary}]}>
              ${item.calling_rate}/min
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.callButton,
            {
              backgroundColor: item.is_available
                ? colors.primary
                : colors.gray[300],
              opacity: item.is_available ? 1 : 0.7, // always a number
            },
          ]}
          onPress={() => handleCallUser(item.id)}
          disabled={!item.is_available}>
          <Icon name="phone" size={18} color={colors.white} />
          <Text style={styles.callButtonText}>
            {item.is_available ? 'Call Now' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tagsContainer}>
        {item.expertise.map((tag, index) => (
          <View
            key={`expertise-${index}`}
            style={[styles.tag, {backgroundColor: colors.primary + '20'}]}>
            <Text style={[styles.tagText, {color: colors.primary}]}>{tag}</Text>
          </View>
        ))}
        {item.tags.map((tag, index) => (
          <View
            key={`tag-${index}`}
            style={[styles.tag, {backgroundColor: colors.gray[100]}]}>
            <Text style={[styles.tagText, {color: colors.text.secondary}]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {' '}
      <Header
        title="TipCall"
        showBackButton={false}
        showLogo={false}
        showWallet={true}
        walletAmount={walletBalance}
      />
      <View
        style={[styles.tabContainer, {borderBottomColor: colors.borderLight}]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'available' && [
              styles.activeTab,
              {borderBottomColor: colors.primary},
            ],
          ]}
          onPress={() => handleTabChange('available')}>
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'available'
                    ? colors.primary
                    : colors.text.secondary,
              },
            ]}>
            Available Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && [
              styles.activeTab,
              {borderBottomColor: colors.primary},
            ],
          ]}
          onPress={() => handleTabChange('all')}>
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'all' ? colors.primary : colors.text.secondary,
              },
            ]}>
            All Experts
          </Text>
        </TouchableOpacity>
      </View>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.primary}]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={{color: colors.primary}}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="phone-off" size={50} color={colors.gray[400]} />
              <Text style={[styles.emptyText, {color: colors.text.secondary}]}>
                {activeTab === 'available'
                  ? 'No experts are available right now'
                  : 'No experts found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  rate: {
    fontSize: 14,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TipCallScreen;
