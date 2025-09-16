// src/screens/status/ViewStatusScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PanGesturer,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X, Heart, Eye } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StatusItem {
  id: number;
  content: string;
  media_url: string | null;
  media_type: 'text' | 'image' | 'video';
  price_to_view: number;
  is_premium_only: boolean;
  created_at: string;
  expires_at: string;
  has_viewed: boolean;
  view_count: number;
}

interface ViewStatusScreenProps {}

const ViewStatusScreen: React.FC<ViewStatusScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(colors);

  // Get params from navigation
  const { userId, statuses } = route.params as { userId: number; statuses: StatusItem[] };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const progressRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStatus = statuses[currentIndex];

  const handleClose = useCallback(() => {
    if (progressRef.current) {
      progressRef.current.stop();
    }
    navigation.goBack();
  }, [navigation]);

  const markAsViewed = useCallback(async (statusId: number) => {
    try {
      await ApiService.post('/addStatusViewers', {
        status_id: statusId,
        viewer_id: user?.id || user?.user_id,
      });
    } catch (error) {
      console.error('Error marking status as viewed:', error);
    }
  }, [user]);

  const startProgress = useCallback(() => {
    progress.setValue(0);
    
    progressRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 seconds per status
      useNativeDriver: false,
    });

    progressRef.current.start(({ finished }) => {
      if (finished) {
        // Auto advance to next status
        if (currentIndex < statuses.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // All statuses viewed, close
          handleClose();
        }
      }
    });
  }, [progress, currentIndex, statuses.length, handleClose]);

  const goToNextStatus = useCallback(() => {
    if (progressRef.current) {
      progressRef.current.stop();
    }
    
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  }, [currentIndex, statuses.length, handleClose]);

  const goToPreviousStatus = useCallback(() => {
    if (progressRef.current) {
      progressRef.current.stop();
    }
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentStatus) {
      // Mark as viewed
      markAsViewed(currentStatus.id);
      
      // Start progress animation
      startProgress();
    }

    return () => {
      if (progressRef.current) {
        progressRef.current.stop();
      }
    };
  }, [currentIndex, currentStatus, markAsViewed, startProgress]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const renderStatusContent = () => {
    if (!currentStatus) return null;

    if (currentStatus.media_type === 'text') {
      return (
        <View style={styles.textStatusContainer}>
          <Text style={styles.statusText}>{currentStatus.content}</Text>
        </View>
      );
    }

    if (currentStatus.media_type === 'image' && currentStatus.media_url) {
      return (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: currentStatus.media_url }} style={styles.statusImage} />
          {currentStatus.content && (
            <View style={styles.textOverlay}>
              <Text style={styles.overlayText}>{currentStatus.content}</Text>
            </View>
          )}
        </View>
      );
    }

    // Add video support later
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {statuses.map((_, index) => (
          <View key={index} style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: index === currentIndex 
                    ? progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : index < currentIndex ? '100%' : '0%'
                }
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View>
            <Text style={styles.userName}>User {userId}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(currentStatus?.created_at || '')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Touch Areas for Navigation */}
      <View style={styles.touchContainer}>
        <TouchableOpacity
          style={styles.leftTouch}
          onPress={goToPreviousStatus}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.rightTouch}
          onPress={goToNextStatus}
          activeOpacity={1}
        />
      </View>

      {/* Status Content */}
      <View style={styles.contentContainer}>
        {renderStatusContent()}
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <View style={styles.statusInfo}>
          <Eye size={16} color={colors.white} />
          <Text style={styles.viewCount}>{currentStatus?.view_count || 0}</Text>
        </View>
        <Text style={styles.statusCounter}>
          {currentIndex + 1} of {statuses.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black || '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  touchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1,
  },
  leftTouch: {
    flex: 1,
  },
  rightTouch: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 32,
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'cover',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 12,
  },
  overlayText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCount: {
    fontSize: 14,
    color: colors.white,
  },
  statusCounter: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ViewStatusScreen;