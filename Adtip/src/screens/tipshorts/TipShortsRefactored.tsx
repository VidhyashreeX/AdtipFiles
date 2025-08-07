import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StatusBar,
  BackHandler,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AppState,
  Text,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useQueryClient } from '@tanstack/react-query';

// Contexts and hooks
import { useAuth } from '../../contexts/AuthContext';
import {
  useLikeShortMutation,
  SHORTS_QUERY_KEY,
  type ShortVideo as TanStackShortVideo
} from '../../hooks/useShortsQuery';

// Components
import { TipShortsDataProvider } from './components/TipShortsDataProvider';
import { TipShortsControlsProvider } from './components/TipShortsControls';
import { TipShortsGestureProvider } from './components/TipShortsGestureHandler';
import { TipShortsRewardProvider } from './components/TipShortsRewardManager';
import { TipShortsVideoList } from './components/TipShortsVideoList';
import LoginPromptModal from '../../components/modals/LoginPromptModal';
import VideoCommentsModal from '../../components/tiptube/VideoCommentsModal';
import InshortsRewardPopup from '../../components/common/InshortsRewardPopup';

import ApiService from '../../services/ApiService';
import { TipShortsLogger } from '../../utils/logger';

// Use the TanStack query types
type ShortVideo = TanStackShortVideo;

type TipShortsRouteParams = {
  shorts?: ShortVideo[];
  startIndex?: number;
  shortId?: string;
};

type TipShortsRouteProp = RouteProp<{ params: TipShortsRouteParams }, 'params'>;

// Main TipShorts Refactored Component
const TipShortsRefactored = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<TipShortsRouteProp>();
  const isFocused = useIsFocused();
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // Safe parameter destructuring
  const { shorts: passedShorts, startIndex = 0, shortId } = route.params || {};

  // Debug logging for route params
  useEffect(() => {
    if (__DEV__) {
      TipShortsLogger.debug('TipShortsRefactored - Route params:', {
        passedShorts: passedShorts?.length || 0,
        startIndex,
        shortId,
        hasParams: !!route.params
      });

      if (shortId) {
        TipShortsLogger.debug('TipShortsRefactored - Deep link detected for shortId:', shortId);
      }
    }
  }, [route.params, passedShorts, startIndex, shortId]);

  // Local states for modals
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('Login to unlock all features');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentShortId, setSelectedCommentShortId] = useState<string | null>(null);

  // Mutations
  const likeMutation = useLikeShortMutation();

  // Handle like action
  const handleLikeShort = useCallback(async (shortId: string, creatorId: string, isCurrentlyLiked: boolean) => {
    if (isGuest) {
      setLoginPromptMessage('Login to like shorts and support creators');
      setShowLoginPrompt(true);
      return;
    }

    try {
      TipShortsLogger.debug('Liking short:', { shortId, creatorId, isCurrentlyLiked });
      
      await likeMutation.mutateAsync({
        shortId,
        creatorId,
        isLiked: !isCurrentlyLiked,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [SHORTS_QUERY_KEY] });
    } catch (error) {
      TipShortsLogger.error('Error liking short:', error);
      Alert.alert('Error', 'Failed to like short. Please try again.');
    }
  }, [isGuest, likeMutation, queryClient]);

  // Handle comment action
  const handleCommentShort = useCallback((shortId: string) => {
    if (isGuest) {
      setLoginPromptMessage('Login to comment on shorts');
      setShowLoginPrompt(true);
      return;
    }

    setSelectedCommentShortId(shortId);
    setCommentModalVisible(true);
  }, [isGuest]);

  // Handle follow action
  const handleFollowChannel = useCallback(async (channelId: string) => {
    if (isGuest) {
      setLoginPromptMessage('Login to follow channels');
      setShowLoginPrompt(true);
      return;
    }

    try {
      await ApiService.followChannel(channelId);
      Alert.alert('Success', 'Channel followed successfully!');
    } catch (error) {
      TipShortsLogger.error('Error following channel:', error);
      Alert.alert('Error', 'Failed to follow channel. Please try again.');
    }
  }, [isGuest]);

  // Handle channel navigation
  const handleChannelNavigation = useCallback((channelData: { id: string; name: string; avatar?: string }) => {
    navigation.navigate('Channel', { channelId: channelData.id });
  }, [navigation]);

  // Handle guest actions
  const showLoginPromptForAction = useCallback((action: string) => {
    const messages = {
      like: 'Login to like shorts and support creators',
      comment: 'Login to comment on shorts',
      follow: 'Login to follow channels',
      share: 'Login to share shorts',
      default: 'Login to unlock all features'
    };
    
    setLoginPromptMessage(messages[action as keyof typeof messages] || messages.default);
    setShowLoginPrompt(true);
  }, []);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (isFocused) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isFocused, navigation]);

  // Handle app state changes for proper cleanup
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        TipShortsLogger.debug('App going to background, pausing videos');
        // Videos will be paused automatically by the controls provider
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return (
    <TipShortsDataProvider passedShorts={passedShorts} shortId={shortId}>
      <TipShortsControlsProvider startIndex={startIndex}>
        <TipShortsGestureProvider>
          <TipShortsRewardProvider>
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
              
              {/* Header */}
              <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shorts</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Video List */}
              <TipShortsVideoList
                onLike={handleLikeShort}
                onChannelNavigation={handleChannelNavigation}
                onComment={handleCommentShort}
                onFollow={handleFollowChannel}
                onGuestAction={showLoginPromptForAction}
                isGuest={isGuest}
                insets={insets}
              />

              {/* Modals */}
              <LoginPromptModal
                visible={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                message={loginPromptMessage}
              />

              <VideoCommentsModal
                visible={commentModalVisible}
                onClose={() => setCommentModalVisible(false)}
                videoId={selectedCommentShortId || ''}
                videoType="short"
              />

              <InshortsRewardPopup />
            </SafeAreaView>
          </TipShortsRewardProvider>
        </TipShortsGestureProvider>
      </TipShortsControlsProvider>
    </TipShortsDataProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
});

export default TipShortsRefactored;
