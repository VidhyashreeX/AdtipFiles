import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native'; // Added useFocusEffect
import Video from 'react-native-video';
import axios from 'axios';

import {useTheme} from '../../contexts/ThemeContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import Header from '../../components/common/Header';
import VideoCardSkeleton from '../../components/skeletons/VideoCardSkeleton';
import RelatedVideoCardSkeleton from '../../components/skeletons/RelatedVideoCardSkeleton';
import MemoizedRelatedVideoCard from '../../components/tiptube/MemoizedRelatedVideoCard';

// Define interfaces (ensure these match your data structure)
interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  duration: number;
  views: number;
  posted: string;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  channelId: number | string;
  price?: number;
}

const categories = [
  {name: 'All', icon: '🌍'}, {name: 'Gaming', icon: '🎮'}, {name: 'Music', icon: '🎵'},
  {name: 'Education', icon: '📚'}, {name: 'Sports', icon: '⚽️'}, {name: 'Tech', icon: '💻'},
  {name: 'News', icon: '📰'}, {name: 'Comedy', icon: '😂'},
];

const categoryToIdMap: {[key: string]: number} = {
  All: 0, Gaming: 1, Music: 2, Education: 3, Sports: 4, Tech: 5, News: 6, Comedy: 7,
};

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (num: number) => (num < 10 ? '0' + num : num);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const TipTubeScreen = () => {
  const {isDarkMode, colors} = useTheme();
  const {contentPaddingBottom} = useTabNavigator();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const {user} = useAuth();
  const navigation = useNavigation<any>();

  const scrollViewRef = useRef<ScrollView>(null);
  const upNextFlatListRef = useRef<FlatList<Video>>(null); // Ref for Up Next FlatList

  const [upNextVideos, setUpNextVideos] = useState<Video[]>([]);
  // loadingUpNext can signify processing the list or waiting for main video to load
  const [loadingUpNext, setLoadingUpNext] = useState(false); 
  const [mainVideoLoaded, setMainVideoLoaded] = useState(false);

  const mainListAbortControllerRef = useRef<AbortController | null>(null);

  const styles = createStyles(colors, isDarkMode);

  // Define renderInitialSkeleton here, as it uses styles and is called in an early return.
  const renderInitialSkeleton = () => (
    <View style={styles.videoGrid}>{Array(6).fill(0).map((_, index) => <VideoCardSkeleton key={`skeleton-${index}`} />)}</View>
  );

  const transformVideoData = useCallback((apiVideo: any): Video => ({
    // ... same as before
    id: apiVideo.id || 0, title: apiVideo.name || apiVideo.title || "Untitled Video",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link || apiVideo.videoUrl,
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    views: apiVideo.total_views || 0, posted: apiVideo.createddate || "Recently",
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator", isVerified: false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  }), []);

  const fetchVideos = useCallback(async (isReset: boolean, pageToFetch: number, signal?: AbortSignal) => {
    // ... same as before (fetches for the main list)
    try {
      const userIdForApi = user?.id ? user.id : 0;
      const categoryId = categoryToIdMap[selectedCategory] || 0;
      const apiRes = await ApiService.getVideos(userIdForApi, categoryId, pageToFetch, search, signal);
      let newVideosData: Video[] = [];
      if (apiRes && Array.isArray(apiRes.data)) {
        newVideosData = apiRes.data.map(transformVideoData);
      }

      if (signal?.aborted) {
        console.log('[TipTubeScreen FetchVideos] Request aborted before state update.');
        return;
      }

      if (isReset) {
        setVideos(shuffleArray(newVideosData)); // Shuffle main list on reset
        setOffset(pageToFetch + 1);
      } else {
        setVideos((prevVideos) => [...prevVideos, ...newVideosData]);
        if (newVideosData.length > 0) {
          setOffset(pageToFetch + 1);
        }
      }
      setHasMore(newVideosData.length > 0);
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'AbortError') {
        console.log("[TipTubeScreen FetchVideos] Request canceled/aborted:", err.message);
      } else {
        console.error("[TipTubeScreen] Failed to fetch videos:", err);
        setHasMore(false);
      }
    }
  }, [selectedCategory, search, user?.id, transformVideoData]);

  useEffect(() => { // Initial Load & Category/Search Changes for main list
    // ... same as before ...
    console.log(`[TipTubeScreen] Initial load or category/search. Category: ${selectedCategory}, Search: ${search}`);
    mainListAbortControllerRef.current?.abort();
    mainListAbortControllerRef.current = new AbortController();
    const signal = mainListAbortControllerRef.current.signal;

    setInitialLoading(true);
    setVideos([]);
    setHasMore(true);
    setOffset(1);

    fetchVideos(true, 1, signal).finally(() => {
      if (!signal.aborted) setInitialLoading(false);
      else console.log('[TipTubeScreen InitialLoadEffect] Initial fetch aborted.');
    });
    return () => {
        mainListAbortControllerRef.current?.abort();
    }
  }, [selectedCategory, search, fetchVideos]);

  const handleRefresh = useCallback(async () => {
    // ... same as before ...
    console.log('[TipTubeScreen] Refresh triggered.');
    mainListAbortControllerRef.current?.abort();
    mainListAbortControllerRef.current = new AbortController();
    const signal = mainListAbortControllerRef.current.signal;

    setRefreshing(true);
    setHasMore(true);
    await fetchVideos(true, 1, signal);
    if (!signal.aborted) setRefreshing(false);
    else console.log('[TipTubeScreen Refresh] Refresh fetch aborted.');
  }, [fetchVideos]);

  const handleScroll = useCallback(({nativeEvent}: {nativeEvent: any}) => {
    // ... same as before ...
    const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
    const paddingToBottom = 250;

    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom &&
      !initialLoading && !loading && hasMore && !refreshing
    ) {
      console.log(`[TipTubeScreen] Scroll reached near bottom. Attempting to load page: ${offset}`);
      setLoading(true); 

      if (!mainListAbortControllerRef.current || mainListAbortControllerRef.current.signal.aborted) {
        mainListAbortControllerRef.current = new AbortController();
      }
      const signal = mainListAbortControllerRef.current.signal;

      fetchVideos(false, offset, signal).finally(() => {
        if (!signal.aborted) setLoading(false);
        else console.log('[TipTubeScreen ScrollPagination] Pagination fetch aborted.');
      });
    }
  }, [initialLoading, loading, hasMore, refreshing, offset, fetchVideos]);

  const handleMainVideoLoad = useCallback(() => {
    console.log("[TipTubeScreen] Main video onLoad triggered.");
    setMainVideoLoaded(true); // This will trigger the UpNextEffect to process the list
  }, []);

  useEffect(() => { // Effect to prepare "Up Next" videos
    if (showPlayerModal && currentVideo) {
      if (!mainVideoLoaded) {
        // Main video is not yet loaded (or a new video was selected and mainVideoLoaded was reset).
        // Clear previous Up Next videos and ensure skeletons are not shown yet for "Up Next".
        console.log("[TipTubeScreen UpNextEffect] Main video not loaded. Clearing UpNext. No skeletons for Up Next yet.");
        setUpNextVideos([]);
        setLoadingUpNext(false); // Explicitly set to false
        return;
      }

      // Main video IS loaded (mainVideoLoaded is true).
      // This block will execute after `onLoad` of the main video.
      console.log("[TipTubeScreen UpNextEffect] Main video loaded. Processing Up Next list. Skeletons will show now.");
      setLoadingUpNext(true); // Indicate processing for Up Next list, skeletons will appear now.
      
      // Process the list. This is synchronous and should be fast.
      // If it were async, skeletons would show for longer.
      const filteredAndShuffled = shuffleArray(videos.filter(v => v.id !== currentVideo.id));
      setUpNextVideos(filteredAndShuffled);
      setLoadingUpNext(false); // Done processing, skeletons will be replaced.

    } else if (!showPlayerModal) {
      // Modal closed, clear Up Next and reset states
      setUpNextVideos([]);
      setLoadingUpNext(false);
      setMainVideoLoaded(false);
    }
  }, [showPlayerModal, currentVideo, videos, mainVideoLoaded]); // Depends on main 'videos' list and mainVideoLoaded

  useFocusEffect(
    useCallback(() => {
      return () => {
        console.log('[TipTubeScreen] Screen lost focus or unmounted: Aborting main list fetch.');
        mainListAbortControllerRef.current?.abort();
        if (showPlayerModal) {
            setMainVideoLoaded(false); 
        }
      };
    }, [showPlayerModal])
  );

  const openPlayer = (video: Video) => {
    if (currentVideo?.id !== video.id) {
        setMainVideoLoaded(false); // Reset for the new video, UpNextEffect will wait for onLoad
    }
    setCurrentVideo(video);
    setShowPlayerModal(true);
  };

  const closePlayer = () => {
    setShowPlayerModal(false);
    setCurrentVideo(null);
    setMainVideoLoaded(false);
    setUpNextVideos([]);
    setLoadingUpNext(false);
  };

  const renderVideoCard = (video: Video) => (
    // ... same as before ...
    <TouchableOpacity key={video.id} style={styles.videoCard} onPress={() => openPlayer(video)} onPressIn={() => setPreviewingVideoId(video.id)} onPressOut={() => setPreviewingVideoId(null)}>
      <View style={styles.thumbnailContainer}>
        {video.price && video.price > 0 && (<View style={styles.priceBadge}><Text style={styles.priceBadgeText}>₹{video.price}</Text></View>)}
        {previewingVideoId === video.id && video.videoUrl ? (
          <Video source={{uri: video.videoUrl}} style={styles.videoThumbnail} resizeMode="cover" repeat muted paused={previewingVideoId !== video.id} playInBackground={false} playWhenInactive={false} ignoreSilentSwitch="obey" />
        ) : (
          <Image source={{uri: video.thumbnail || "https://via.placeholder.com/300x169.png?text=No+Thumbnail"}} style={styles.thumbnailImage} resizeMode="cover" />
        )}
        <View style={styles.durationOverlay}><Text style={styles.durationText}>{formatDuration(video.duration)}</Text></View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.creatorInfo}>
          <Image source={{uri: video.avatar || "https://via.placeholder.com/32.png?text=N/A"}} style={styles.avatar} />
          <View style={styles.creatorText}>
            <TouchableOpacity onPress={() => { closePlayer(); navigation.navigate("Channel", {channelId: video.channelId}); }}>
              <Text style={styles.creatorName} numberOfLines={1}>{video.creatorName}</Text>
            </TouchableOpacity>
            <Text style={styles.videoStats}>{video.views.toLocaleString()} views • {video.posted}</Text>
          </View>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRelatedVideoItem = useCallback(({item}: {item: Video}) => (
    <MemoizedRelatedVideoCard 
      item={item} 
      onPress={() => {
        console.log("Clicked Up Next item, new video ID:", item.id);
        setMainVideoLoaded(false); // New video needs to load, reset mainVideoLoaded
        setCurrentVideo(item);     // Set as current
        upNextFlatListRef.current?.scrollToOffset({ animated: false, offset: 0 });
      }} 
    />
  ), [setCurrentVideo]);


  if (initialLoading && !refreshing) {
    // ... same as before ...
    return (
      <View style={styles.container}>
        <Header title="TipTube" showTipShortsIcon />
        <ScrollView contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
            {categories.map((cat) => (<TouchableOpacity key={cat.name} style={styles.categoryButton} disabled={true}><Text style={styles.categoryButtonText}>{cat.icon} {cat.name}</Text></TouchableOpacity>))}
          </ScrollView>
          {renderInitialSkeleton()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="TipTube" showTipShortsIcon />
      <ScrollView
        // ... same as before ...
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
          {categories.map((cat) => (<TouchableOpacity key={cat.name} onPress={() => setSelectedCategory(cat.name)} style={[styles.categoryButton, selectedCategory === cat.name && styles.selectedCategoryButton]}><Text style={[styles.categoryButtonText, selectedCategory === cat.name && styles.selectedCategoryButtonText]}>{cat.icon} {cat.name}</Text></TouchableOpacity>))}
        </ScrollView>
        {videos.length === 0 && loading && !refreshing && !initialLoading ? (<View style={[styles.loadingContainer, {flex: 1, justifyContent: 'center', paddingTop: 50}]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading videos...</Text></View>) : (<View style={styles.videoGrid}>{videos.map(renderVideoCard)}</View>)}
        {loading && videos.length > 0 && (<View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading more...</Text></View>)}
        {!loading && !initialLoading && !hasMore && videos.length === 0 && !refreshing && (<View style={styles.noVideosContainer}><Text style={[styles.noVideosText, {color: colors.text.secondary}]}>No videos found.</Text></View>)}
      </ScrollView>
      <Modal visible={showPlayerModal} animationType="slide" presentationStyle="fullScreen" onRequestClose={closePlayer}>
        <View style={styles.playerModalContainer}>
          {currentVideo && (
            <>
              <Video 
                source={{uri: currentVideo.videoUrl!}} 
                style={styles.mainVideoPlayer} 
                controls={true} 
                // Video starts playing when modal is shown AND mainVideoLoaded is true
                paused={!showPlayerModal || !mainVideoLoaded} 
                resizeMode="contain"
                onLoad={handleMainVideoLoad} // <<< This triggers mainVideoLoaded = true
                onError={(e) => console.error("Main Video Error:", e)}
                bufferConfig={{
                  minBufferMs: 15000, maxBufferMs: 50000,
                  bufferForPlaybackMs: 2500, bufferForPlaybackAfterRebufferMs: 5000
                }}
              />
              <View style={styles.mainVideoInfo}>
                <Text style={styles.mainVideoTitle}>{currentVideo.title}</Text>
                <View style={styles.mainVideoCreatorSection}>
                  <Image source={{uri: currentVideo.avatar || "https://via.placeholder.com/40.png?text=N/A"}} style={styles.mainVideoAvatar} />
                  <View style={styles.mainVideoCreatorText}>
                    <TouchableOpacity onPress={() => { closePlayer(); navigation.navigate("Channel", {channelId: currentVideo.channelId}); }}><Text style={styles.mainVideoCreatorName}>{currentVideo.creatorName}</Text></TouchableOpacity>
                    <Text style={styles.mainVideoStats}>{currentVideo.views.toLocaleString()} views • {currentVideo.posted}</Text>
                  </View>
                  <TouchableOpacity style={styles.subscribeButton}><Text style={styles.subscribeButtonText}>Subscribe</Text></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={closePlayer} style={styles.backButton}><Text style={styles.backButtonText}>Back to Feed</Text></TouchableOpacity>
              </View>

              <View style={styles.relatedVideosSection}>
                <Text style={styles.relatedVideosTitle}>Up Next</Text>
                {/* 
                  Show skeletons if:
                  1. Main video has loaded (`mainVideoLoaded` is true).
                  2. We are currently "processing" the upNextVideos list (`loadingUpNext` is true).
                  3. The `upNextVideos` array is still empty (before it's populated).
                */}
                {mainVideoLoaded && loadingUpNext && upNextVideos.length === 0 ? (
                  <View>
                    {Array(5).fill(0).map((_, i) => <RelatedVideoCardSkeleton key={`upnext-skel-${i}`} />)}
                  </View>
                ) : (
                  <FlatList
                    ref={upNextFlatListRef}
                    data={upNextVideos} 
                    renderItem={renderRelatedVideoItem}
                    keyExtractor={(item) => `upnext-${item.id.toString()}`}
                    initialNumToRender={5}
                    windowSize={10}
                    ListEmptyComponent={
                      // Show "No other videos" only if main video has loaded and we are not in the loadingUpNext phase
                      mainVideoLoaded && !loadingUpNext && upNextVideos.length === 0 ? 
                      <Text style={[styles.noVideosText, {textAlign: 'center', paddingVertical: 20}]}>No other videos available.</Text> : null
                    }
                  />
                )}
              </View>
            </>
          )}
          {/* Fallback if currentVideo is somehow null but modal is open */}
          {!currentVideo && showPlayerModal && (
            <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{color: colors.text.primary, marginTop: 10}}>Loading video...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_GAP = 16;
const NUM_COLUMNS = 2;
const cardWidth = (screenWidth - CARD_MARGIN_HORIZONTAL * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollViewContent: { paddingHorizontal: CARD_MARGIN_HORIZONTAL, paddingTop: 16, },
  categoryScroller: { marginBottom: 16, paddingHorizontal: 0, marginLeft: -CARD_MARGIN_HORIZONTAL, marginRight: -CARD_MARGIN_HORIZONTAL, paddingLeft: CARD_MARGIN_HORIZONTAL },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderRadius: 20, backgroundColor: colors.cardSecondary, borderWidth: 1, borderColor: colors.border },
  selectedCategoryButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryButtonText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  selectedCategoryButtonText: { color: colors.white },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  videoCard: { width: cardWidth, marginBottom: CARD_GAP, backgroundColor: colors.card, borderRadius: 12, shadowColor: colors.shadow, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  thumbnailContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.border },
  thumbnailImage: { flex: 1 }, videoThumbnail: { flex: 1 },
  durationOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  priceBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, zIndex: 1 },
  priceBadgeText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  cardContent: { padding: 10 },
  creatorInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.border },
  creatorText: { flex: 1 },
  creatorName: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  videoStats: { fontSize: 11, color: colors.text.tertiary },
  videoTitle: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginTop: 4, lineHeight: 18 },
  loadingContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: colors.text.secondary },
  noVideosContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  noVideosText: { fontSize: 16, color: colors.text.secondary },
  playerModalContainer: { flex: 1, backgroundColor: colors.background },
  mainVideoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  mainVideoInfo: { padding: 16 },
  mainVideoTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 },
  mainVideoCreatorSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mainVideoAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: colors.border },
  mainVideoCreatorText: { flex: 1 },
  mainVideoCreatorName: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  mainVideoStats: { fontSize: 13, color: colors.text.tertiary },
  subscribeButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribeButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderLight, paddingVertical: 10 },
  backButton: { alignItems: 'center', paddingVertical: 12, backgroundColor: colors.cardSecondary, borderRadius: 8, marginTop: 10 },
  backButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  relatedVideosSection: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  relatedVideosTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 },
  relatedVideoCard: { flexDirection: 'row', marginBottom: 12, backgroundColor: colors.card, borderRadius: 8, overflow: 'hidden' },
  relatedVideoThumbnail: { width: 120, height: 67, backgroundColor: colors.border },
  relatedVideoContent: { flex: 1, padding: 10, justifyContent: 'center' },
  relatedVideoTitle: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginBottom: 2 },
  relatedVideoCreator: { fontSize: 12, color: colors.text.secondary },
  relatedVideoStats: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
});

export default React.memo(TipTubeScreen);