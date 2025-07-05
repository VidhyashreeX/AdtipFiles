import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import {useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead} from '../../hooks/useQueries';
import {useAuth} from '../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'like' | 'comment' | 'follow' | 'reward' | 'system';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

const NotificationScreen: React.FC = () => {
  const {colors} = useTheme();
  const {user} = useAuth();
  const userId = user?.id || 0;

  // TanStack Query hooks
  const notificationsQuery = useNotifications(userId);
  const unreadCountQuery = useUnreadNotificationCount(userId);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'message-circle';
      case 'follow':
        return 'user-plus';
      case 'reward':
        return 'dollar-sign';
      case 'system':
        return 'bell';
      default:
        return 'bell';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'like':
        return '#FF6B6B';
      case 'comment':
        return '#4ECDC4';
      case 'follow':
        return '#45B7D1';
      case 'reward':
        return '#96CEB4';
      case 'system':
        return '#FFEAA7';
      default:
        return colors.text.secondary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate({
      userId,
      notificationId: parseInt(notificationId)
    });
  }, [markAsReadMutation, userId]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate(userId);
  }, [markAllAsReadMutation, userId]);

  const deleteNotification = useCallback((notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete notification API
            console.log('Delete notification:', notificationId);
          },
        },
      ],
    );
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.actionUrl) {
      // Navigate to specific screen
      console.log('Navigate to:', notification.actionUrl);
    }
  }, [markAsRead]);

  // Transform API data to match our interface
  const transformNotifications = (apiData: any[]): Notification[] => {
    return apiData.map(item => ({
      id: item.id?.toString() || '',
      title: item.title || item.type || 'Notification',
      message: item.message || item.content || '',
      type: item.type || 'system',
      timestamp: new Date(item.created_at || item.timestamp || Date.now()),
      isRead: item.is_read || item.read || false,
      actionUrl: item.action_url || item.url,
    }));
  };

  const notifications = notificationsQuery.data?.pages?.flatMap(page => 
    transformNotifications(page?.data || [])
  ) || [];

  const unreadCount = unreadCountQuery.data?.unread_count || 0;

  const renderNotification = ({item}: {item: Notification}) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {backgroundColor: item.isRead ? 'transparent' : colors.surface},
        {borderBottomColor: colors.border},
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}>
      <View
        style={[
          styles.iconContainer,
          {backgroundColor: getTypeColor(item.type) + '20'},
        ]}>
        <Icon
          name={getTypeIcon(item.type)}
          size={20}
          color={getTypeColor(item.type)}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, {color: colors.text.primary}]}>
          {item.title}
        </Text>
        <Text style={[styles.message, {color: colors.text.secondary}]}>
          {item.message}
        </Text>
        <Text style={[styles.timestamp, {color: colors.text.tertiary}]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      {!item.isRead && (
        <View style={[styles.unreadDot, {backgroundColor: colors.primary}]} />
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (notificationsQuery.isFetchingNextPage) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingMoreText, {color: colors.text.secondary}]}>
            Loading more...
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Notifications"
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
              disabled={markAllAsReadMutation.isPending}>
              <Text style={[styles.markAllText, {color: colors.primary}]}>
                {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {unreadCount > 0 && (
        <View
          style={[
            styles.unreadBanner,
            {backgroundColor: colors.primary + '10'},
          ]}>
          <Text style={[styles.unreadBannerText, {color: colors.primary}]}>
            You have {unreadCount} unread notification
            {unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {notificationsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text.secondary}]}>
            Loading notifications...
          </Text>
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          onEndReached={() => notificationsQuery.fetchNextPage()}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="bell" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, {color: colors.text.secondary}]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtext, {color: colors.text.tertiary}]}>
            You'll see notifications here when you get likes, comments, and more
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unreadBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  unreadBannerText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;
