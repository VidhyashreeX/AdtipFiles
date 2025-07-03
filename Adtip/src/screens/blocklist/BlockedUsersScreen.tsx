import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import Icon from 'react-native-vector-icons/Feather';
import BlocklistService, { BlockedUser } from '../../services/BlocklistService';

const BlockedUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const blocklistService = BlocklistService.getInstance();

  const loadBlockedUsers = useCallback(async () => {
    try {
      const users = blocklistService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('[BlockedUsersScreen] Failed to load blocked users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [blocklistService]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  }, [loadBlockedUsers]);

  const handleUnblockUser = useCallback((user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              await blocklistService.unblockUser(user.id);
              // Make sure we properly refresh the list after unblocking
              await loadBlockedUsers();
              // Explicitly notify the user about success
              Alert.alert('Success', `${user.name} has been unblocked.`);
            } catch (error) {
              console.error('[BlockedUsersScreen] Failed to unblock user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  }, [blocklistService, loadBlockedUsers]);

  const handleClearAll = useCallback(() => {
    if (blockedUsers.length === 0) return;

    Alert.alert(
      'Clear All Blocked Users',
      'Are you sure you want to unblock all users? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await blocklistService.clearBlocklist();
              // Make sure we properly refresh the list after clearing
              await loadBlockedUsers();
              // Explicitly notify the user about success  
              Alert.alert('Success', 'All users have been unblocked.');
            } catch (error) {
              console.error('[BlockedUsersScreen] Failed to clear blocklist:', error);
              Alert.alert('Error', 'Failed to clear blocklist. Please try again.');
            }
          },
        },
      ]
    );
  }, [blocklistService, loadBlockedUsers, blockedUsers.length]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.error }]}>
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.text.primary }]} numberOfLines={1}>
            {item.name || 'Unknown User'}
          </Text>
          <Text style={[styles.userId, { color: colors.text.secondary }]} numberOfLines={1}>
            ID: {item.id}
          </Text>
          <Text style={[styles.blockedDate, { color: colors.text.tertiary }]} numberOfLines={1}>
            Blocked on {formatDate(item.blockedAt)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.unblockButton, { backgroundColor: colors.success }]}
        onPress={() => handleUnblockUser(item)}
        activeOpacity={0.8}
      >
        <Icon name="user-check" size={16} color="#FFFFFF" />
        <Text style={styles.unblockButtonText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.gray[200] }]}>
        <Icon name="shield" size={48} color={colors.text.tertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        No Blocked Users
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>
        You haven't blocked any users yet. Long press on any contact in TipCall to block them.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Blocked Users"
          leftComponent={
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
          showSearch={false}
          showWallet={false}
          showPremium={false}
        />
        <View style={styles.loadingContainer}>
          <Icon name="loader" size={32} color={colors.text.secondary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Blocked Users"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
        rightComponent={
          blockedUsers.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
              <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          ) : null
        }
        showSearch={false}
        showWallet={false}
        showPremium={false}
      />
      
      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          blockedUsers.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userId: {
    fontSize: 14,
    marginBottom: 2,
  },
  blockedDate: {
    fontSize: 12,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BlockedUsersScreen;
