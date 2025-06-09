import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  FlatList, // Import FlatList
} from "react-native";
import Video from "react-native-video"; // Import react-native-video
import { useAuth } from "../../contexts/AuthContext"; // Assuming AuthContext works similarly
import { useNavigation } from "@react-navigation/native"; // For React Navigation
import { useTheme } from "../../contexts/ThemeContext";
import { useTabNavigator } from "../../contexts/TabNavigatorContext";
import ApiService from "../../services/ApiService";

// Components
import Header from "../../components/common/Header";

// Get screen width for responsive image/video sizing
const { width: screenWidth } = Dimensions.get("window");

// Add icons for categories (using emoji or SVG for demo, but typically you'd use a dedicated icon library)
const categories = [
  { name: "All", icon: "🏠" },
  { name: "Tech", icon: "💻" },
  { name: "Beauty", icon: "💄" },
  { name: "Gaming", icon: "🎮" },
  { name: "Food", icon: "🍔" },
  { name: "Travel", icon: "✈️" },
  { name: "Finance", icon: "💰" },
  { name: "Fashion", icon: "👗" },
  { name: "Music", icon: "🎵" },
  { name: "Sports", icon: "🏀" },
  { name: "Education", icon: "📚" },
];
const categoryToIdMap: { [key: string]: number } = {
  All: 0,
  Tech: 1,
  Beauty: 2,
  Gaming: 3,
  Food: 4,
  Travel: 5,
  Finance: 6,
  Fashion: 7,
  Music: 8,
  Sports: 9,
  Education: 10,
};

interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  duration?: number;
  views: number;
  posted: string;
  channelId: number;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  price?: number;
}

const formatDuration = (duration: number | string | undefined) => {
  if (duration === undefined || duration === null) return "0:00";
  const totalSeconds = typeof duration === "string" ? parseInt(duration, 10) : duration;
  if (isNaN(totalSeconds)) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Sidebar menu definitions (Icons won't render directly as SVG components without specific libraries like react-native-svg)
// For React Native, you'd typically use a dedicated icon library (e.g., react-native-vector-icons)
// I'll keep them as placeholders but they won't render as SVGs unless you implement an SVG component system.
const mainMenu = [
  { key: "Home", label: "Home", icon: "" }, // Placeholder for icon
  { key: "TipTube", label: "TipTube", icon: "" },
  { key: "TipShort", label: "TipShort", icon: "" },
  { key: "TipCall", label: "TipCall", icon: "" },
];

const marketplaceMenu = [
  { key: "TipShop", label: "Tip Shop", icon: "" },
  { key: "Analysis", label: "Analysis", icon: "" },
  { key: "Follow", label: "Follow", icon: "" },
  { key: "MyWallet", label: "My Wallet", icon: "" },
  { key: "BecomeSeller", label: "Become Seller", icon: "" },
  { key: "PostAdvertisers", label: "Post Advertisers", icon: "" },
  { key: "PremiumContent", label: "Premium Content", icon: "" },
];

// Utility function to shuffle an array (add this at the top of the file or import from utils)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const TipTubeScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  // State for "Up Next" videos in the player modal
  const [upNextVideos, setUpNextVideos] = useState<Video[]>([]);
  const [upNextOffset, setUpNextOffset] = useState(1);
  const [hasMoreUpNext, setHasMoreUpNext] = useState(true);
  const [loadingUpNext, setLoadingUpNext] = useState(false);

  const styles = createStyles(colors, isDarkMode);

  const transformVideoData = useCallback((apiVideo: any): Video => ({
    id: apiVideo.id || 0,
    title: apiVideo.name || "",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link,
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    views: apiVideo.total_views || 0,
    posted: apiVideo.createddate || "Recently",
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator",
    isVerified: false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  }), []);

  const fetchVideos = useCallback(
    // ... (existing fetchVideos function remains largely the same)
    async (isReset: boolean = false) => {
      if (loading && !isReset && !refreshing) {
        return;
      }
      if (!isReset) {
        setLoading(true);
      }
      const pageToFetch = isReset ? 1 : offset;
      try {
        const userIdForApi = user?.id ? user.id : 0; 
        const categoryId = categoryToIdMap[selectedCategory] || 0;
        const apiRes = await ApiService.getVideos(userIdForApi, categoryId, pageToFetch);
        let newVideosData: Video[] = [];
        if (apiRes && Array.isArray(apiRes.data)) {
          newVideosData = apiRes.data.map(transformVideoData);
        }
        if (isReset) {
          setVideos(shuffleArray(newVideosData));
          setOffset(2);
        } else {
          setVideos((prevVideos) => [...prevVideos, ...newVideosData]);
          if (newVideosData.length > 0) {
            setOffset((prevOffset) => prevOffset + 1);
          }
        }
        const nextPageHasData = newVideosData.length > 0; // Simplified check
        setHasMore(nextPageHasData);

      } catch (err) {
        console.error("[TipTubeScreen] Failed to fetch videos:", err);
        setHasMore(false); 
      } finally {
        if (!isReset) {
          setLoading(false);
        }
      }
    },
    [selectedCategory, offset, user, transformVideoData, loading, refreshing] 
  );

  const fetchUpNextVideos = useCallback(async (isReset: boolean = false) => {
    if (loadingUpNext && !isReset) {
        console.log('[TipTubeScreen] Fetch Up Next: Already loading and not a reset. Skipping.');
        return;
    }
    if (!currentVideo && !isReset) { // Allow reset even if currentVideo is briefly null during transition
        console.log('[TipTubeScreen] Fetch Up Next: No current video. Skipping.');
        return;
    }

    setLoadingUpNext(true);
    const pageToFetch = isReset ? 1 : upNextOffset;
    console.log(`[TipTubeScreen] Fetching Up Next videos. Reset: ${isReset}, Page: ${pageToFetch}`);

    try {
        const userIdForApi = user?.id ? user.id : 0;
        // For "Up Next", fetch from "All" or a specific related category. Here, using "All".
        const categoryIdForUpNext = 0; 

        const apiRes = await ApiService.getVideos(userIdForApi, categoryIdForUpNext, pageToFetch);
        let newVideosData: Video[] = [];

        if (apiRes && Array.isArray(apiRes.data)) {
            newVideosData = apiRes.data
                .map(transformVideoData)
                // Ensure the currently playing video is not in the "Up Next" list immediately
                .filter(v => currentVideo ? v.id !== currentVideo.id : true);
        } else {
            console.warn(`[TipTubeScreen] Up Next API response data is not an array or apiRes is null for page ${pageToFetch}`, apiRes);
        }
        
        if (isReset) {
            setUpNextVideos(newVideosData);
            setUpNextOffset(2); 
        } else {
            // Filter out duplicates that might already be in upNextVideos if API returns overlapping results
            const uniqueNewVideos = newVideosData.filter(
              (newVid) => !upNextVideos.find((existingVid) => existingVid.id === newVid.id) && (currentVideo ? newVid.id !== currentVideo.id : true)
            );
            setUpNextVideos(prevVideos => [...prevVideos, ...uniqueNewVideos]);
            if (uniqueNewVideos.length > 0) {
                setUpNextOffset(prevOffset => prevOffset + 1);
            }
        }
        setHasMoreUpNext(newVideosData.length > 0); // If API returns empty, assume no more for now

    } catch (err) {
        console.error("[TipTubeScreen] Failed to fetch Up Next videos:", err);
        setHasMoreUpNext(false); 
    } finally {
        setLoadingUpNext(false);
    }
  }, [currentVideo, upNextOffset, user, transformVideoData, loadingUpNext, upNextVideos]);


  const handleRefresh = useCallback(async () => {
    // ... (existing handleRefresh function)
    console.log('[TipTubeScreen] Refresh triggered.');
    setRefreshing(true);
    await fetchVideos(true); 
    setRefreshing(false);
  }, [fetchVideos]);

  useEffect(() => {
    // ... (existing useEffect for category change)
    console.log(`[TipTubeScreen] Category changed to: ${selectedCategory}. Resetting and fetching videos.`);
    setVideos([]); 
    setHasMore(true); 
    setOffset(1); 
    fetchVideos(true); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search]); 

  useEffect(() => {
    // ... (existing useEffect for infinite scroll)
    if (offset > 1 && hasMore && !loading && !refreshing) { 
      fetchVideos(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, hasMore, loading, refreshing]); 

  // Effect to load/reset "Up Next" videos when the player modal opens or currentVideo changes
  useEffect(() => {
    if (showPlayerModal && currentVideo) {
        console.log("[TipTubeScreen] Player modal opened or current video changed. Fetching initial Up Next videos for video ID:", currentVideo.id);
        // Resetting states for the "Up Next" list
        setUpNextVideos([]);
        setHasMoreUpNext(true);
        setUpNextOffset(1); // Start from page 1 for the new "Up Next" list
        // setLoadingUpNext(false); // Ensure loading is false before triggering fetch
        // Directly call fetchUpNextVideos with reset true
        // Wrapped in a timeout to allow state to clear if needed, though usually not necessary with useCallback
        setTimeout(() => fetchUpNextVideos(true), 0);
    } else if (!showPlayerModal) {
        // Optionally clear upNextVideos when modal closes to save memory
        // setUpNextVideos([]); 
    }
  // fetchUpNextVideos is a dependency, ensure it's stable or correctly handles its own deps
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [showPlayerModal, currentVideo]); // Removed fetchUpNextVideos from here, will call it directly.

  const handleScroll = useCallback(
    // ... (existing handleScroll function)
    ({ nativeEvent }: { nativeEvent: any }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const paddingToBottom = 250; 
      if (
        contentOffset.y > 0 &&
        contentSize.height > layoutMeasurement.height &&
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom &&
        !loading &&
        hasMore
      ) {
        setOffset((prevOffset) => prevOffset + 1);
      }
    },
    [loading, hasMore]
  );

  const openPlayer = (video: Video) => {
    setCurrentVideo(video);
    setShowPlayerModal(true);
  };
  const closePlayer = () => {
    setShowPlayerModal(false);
    setCurrentVideo(null);
  };

  const renderVideoCard = (video: Video) => (
    // ... (existing renderVideoCard function)
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      onPress={() => openPlayer(video)}
      onPressIn={() => setPreviewingVideoId(video.id)}
      onPressOut={() => setPreviewingVideoId(null)}
    >
      <View style={styles.thumbnailContainer}>
        {video.price && video.price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{video.price}</Text>
          </View>
        )}
        {previewingVideoId === video.id && video.videoUrl ? (
          <Video
            source={{ uri: video.videoUrl }}
            style={styles.videoThumbnail}
            resizeMode="cover"
            repeat
            muted
            paused={previewingVideoId !== video.id}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="obey"
          />
        ) : (
          <Image
            source={{ uri: video.thumbnail || "https://via.placeholder.com/16:9" }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.durationOverlay}>
          <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.creatorInfo}>
          <Image
            source={{ uri: video.avatar || "https://via.placeholder.com/32" }}
            style={styles.avatar}
          />
          <View style={styles.creatorText}>
            <TouchableOpacity
              onPress={() => {
                closePlayer(); // Close modal before navigating
                navigation.navigate("Channel", { channelId: video.channelId });
              }}
            >
              <Text style={styles.creatorName} numberOfLines={1}>
                {video.creatorName}
              </Text>
            </TouchableOpacity>
            <Text style={styles.videoStats}>
              {video.views.toLocaleString()} views • {video.posted}
            </Text>
          </View>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRelatedVideoCard = ({ item }: { item: Video }) => (
    <TouchableOpacity
        style={styles.relatedVideoCard}
        onPress={() => {
            console.log(`[TipTubeScreen] Up Next video pressed: ${item.title}, ID: ${item.id}`);
            setCurrentVideo(item); // This will trigger the useEffect to reload Up Next for the new video
        }}
    >
        <Image
            source={{ uri: item.thumbnail || "https://via.placeholder.com/120x67" }}
            style={styles.relatedVideoThumbnail}
            resizeMode="cover"
        />
        <View style={styles.relatedVideoContent}>
            <Text style={styles.relatedVideoTitle} numberOfLines={2}>
                {item.title}
            </Text>
            <Text style={styles.relatedVideoCreator}>{item.creatorName}</Text>
            <Text style={styles.relatedVideoStats}>
                {item.views.toLocaleString()} views • {item.posted}
            </Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ... (Header and main ScrollView with categories and video grid) ... */}
      <Header title="TipTube" showTipShortsIcon />
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16} 
        contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              onPress={() => setSelectedCategory(cat.name)}
              style={[
                styles.categoryButton,
                selectedCategory === cat.name && styles.selectedCategoryButton,
              ]}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === cat.name && styles.selectedCategoryButtonText,
              ]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.videoGrid}>
          {videos.map(renderVideoCard)}
        </View>

        {loading && videos.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading more...</Text>
          </View>
        )}
        {loading && videos.length === 0 && !refreshing && (
             <View style={[styles.loadingContainer, {flex: 1, justifyContent: 'center', paddingTop: 50}]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading videos...</Text>
            </View>
        )}
        {!loading && !hasMore && videos.length === 0 && !refreshing && (
          <View style={styles.noVideosContainer}>
            <Text style={[styles.noVideosText, {color: colors.text.secondary}]}>No videos found for this category.</Text>
          </View>
        )}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        presentationStyle="fullScreen" // Consider "overFullScreen" for more control if needed
        onRequestClose={closePlayer}
      >
        <View style={styles.playerModalContainer}>
          {currentVideo && (
            <>
              <Video
                source={{ uri: currentVideo.videoUrl }}
                style={styles.mainVideoPlayer}
                controls={true}
                paused={!showPlayerModal}
                resizeMode="contain"
                onFullscreenPlayerWillPresent={() => console.log('Fullscreen entered')}
                onFullscreenPlayerDidDismiss={() => console.log('Fullscreen exited')}
              />
              <View style={styles.mainVideoInfo}>
                <Text style={styles.mainVideoTitle}>{currentVideo.title}</Text>
                <View style={styles.mainVideoCreatorSection}>
                  <Image
                    source={{ uri: currentVideo.avatar || "https://via.placeholder.com/40" }}
                    style={styles.mainVideoAvatar}
                  />
                  <View style={styles.mainVideoCreatorText}>
                    <TouchableOpacity
                      onPress={() => {
                        closePlayer(); // Close modal before navigating
                        navigation.navigate("Channel", { channelId: currentVideo.channelId });
                      }}
                    >
                      <Text style={styles.mainVideoCreatorName}>{currentVideo.creatorName}</Text>
                    </TouchableOpacity>
                    <Text style={styles.mainVideoStats}>
                      {currentVideo.views.toLocaleString()} views • {currentVideo.posted}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.subscribeButton}>
                    <Text style={styles.subscribeButtonText}>Subscribe</Text>
                  </TouchableOpacity>
                </View>
                {/* Simplified like/dislike/share for RN, no SVG icons here without a library */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>👍 Like</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>👎 Dislike</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>🔗 Share</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={closePlayer} style={styles.backButton}>
                  <Text style={styles.backButtonText}>Back to Feed</Text>
                </TouchableOpacity>
              </View>

              {/* Up Next Section with FlatList */}
              <View style={styles.relatedVideosSection}>
                <Text style={styles.relatedVideosTitle}>Up Next</Text>
                <FlatList
                  data={upNextVideos}
                  renderItem={renderRelatedVideoCard}
                  keyExtractor={(item, index) => `${item.id}-${index}`} // Ensure unique keys
                  onEndReached={() => {
                    if (hasMoreUpNext && !loadingUpNext) {
                      console.log("[TipTubeScreen] Reached end of Up Next list. Fetching more.");
                      fetchUpNextVideos(false); // Fetch next page, not a reset
                    }
                  }}
                  onEndReachedThreshold={0.5} // Trigger when 50% of the last item is visible
                  ListFooterComponent={
                    loadingUpNext ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : null
                  }
                  ListEmptyComponent={
                    !loadingUpNext && upNextVideos.length === 0 ? (
                        <Text style={[styles.noVideosText, {color: colors.text.secondary, textAlign: 'center', paddingVertical: 20}]}>No more videos up next.</Text>
                    ) : null
                  }
                />
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

// In createStyles, ensure your loadingText and noVideosText use theme colors
const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },  scrollViewContent: {
    paddingHorizontal: 16,
  },
  categoryScroller: {
    marginBottom: 20,
    height: 40, // Fixed height for category scroller
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: isDarkMode ? colors.gray[700] : colors.gray[200],
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: "#00C896", // adtip-teal (keep consistent for both modes)
  },
  categoryButtonText: {
    color: isDarkMode ? colors.gray[300] : colors.text.secondary,
    fontWeight: "500",
  },
  selectedCategoryButtonText: {
    color: "#fff", // White for both light and dark mode
  },
  videoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Distribute items
    gap: 16, // Simulates Tailwind's gap for flex wrap
  },
  videoCard: {
    width: (screenWidth - 16 * 2 - 16 * 1) / 2, // 2 columns for small screens (32 is horizontal padding, 16 is gap)
    // Adjust based on column count and screen size for md, lg
    // For simplicity, we'll keep 2 columns.
    // For more complex responsive grid, use Dimensions.get('window').width and calculate columns
    backgroundColor: colors.card,
    borderRadius: 12, // rounded-xl
    shadowColor: isDarkMode ? "#000" : "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 16, // gap-6
    overflow: "hidden", // Important for rounded corners
  },  thumbnailContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: isDarkMode ? colors.gray[700] : colors.gray[200],
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  priceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#00C896", // adtip-teal
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999, // rounded-full
    zIndex: 10,
  },
  priceBadgeText: {
    color: "#fff",
    fontSize: 10, // text-xs
    fontWeight: "600", // font-semibold
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  durationOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.8)", // black/80
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4, // rounded
  },
  durationText: {
    color: "#fff",
    fontSize: 10, // text-xs
  },
  cardContent: {
    padding: 12,
    flex: 1, // Allows content to expand
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16, // rounded-full
    marginRight: 12,
  },
  creatorText: {
    flex: 1,
  },
  creatorName: {
    fontSize: 14, // text-sm
    fontWeight: "600", // font-semibold
    color: "#00C896", // adtip-teal
  },
  videoStats: {
    fontSize: 10, // text-xs
    color: colors.text.tertiary,
  },
  videoTitle: {
    fontSize: 16, // text-base
    fontWeight: "500", // font-medium
    color: colors.text.primary,
    marginBottom: 4,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    // color: "#00C896", // Before: adtip-teal. Now themed in JSX.
    fontWeight: "500",
    marginTop: 8,
  },
  noVideosContainer: {
    flex: 1, // Make it take space if it's the only thing
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    minHeight: 200, // Ensure it's visible
  },
  noVideosText: {
    // color: colors.text.tertiary, // Before. Now themed in JSX.
    fontSize: 16,
  },

  // Player Modal Styles
  playerModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    // If mainVideoInfo and relatedVideosSection are in a column, this container needs to manage their layout.
    // If relatedVideosSection is intended to scroll independently of mainVideoInfo,
    // ensure mainVideoInfo doesn't take up all the space.
  },
  mainVideoPlayer: {
    width: "100%",
    aspectRatio: 16 / 9, // aspect-video
    backgroundColor: "#000", // bg-black
  },
  mainVideoInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    // This section should not have flex: 1 if relatedVideosSection is below it and needs to scroll
  },
  mainVideoTitle: {
    fontSize: 20, // text-xl
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 8,
  },
  mainVideoCreatorSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mainVideoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  mainVideoCreatorText: {
    flex: 1,
  },
  mainVideoCreatorName: {
    fontSize: 16, // text-base
    fontWeight: "600",
    color: colors.text.primary,
  },
  mainVideoStats: {
    fontSize: 12, // text-xs
    color: colors.text.tertiary,
  },
  subscribeButton: {
    backgroundColor: "#00C896", // adtip-teal
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999, // rounded-full
    marginLeft: "auto",
  },
  subscribeButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14, // text-sm
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12, // gap-3
    marginTop: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999, // rounded-full
  },
  actionButtonText: {
    color: colors.text.secondary,
    fontWeight: "500",
    marginLeft: 4, // for icon spacing
  },  backButton: {
    backgroundColor: isDarkMode ? colors.gray[700] : colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999, // rounded-full
    alignSelf: "flex-start", // align to start
    marginTop: 16,
  },
  backButtonText: {
    color: colors.text.secondary,
    fontWeight: "500",
  },
  relatedVideosSection: {
    flex: 1, // This allows the FlatList to take remaining space and scroll
    paddingHorizontal: 16, // Add horizontal padding if not already there
    paddingTop: 8, // Some padding at the top
  },
  relatedVideosTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: colors.text.primary,
  },
  relatedVideoCard: {
    flexDirection: "row",
    backgroundColor: colors.card, // Or transparent if you want it to blend
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden", // If using shadows or specific borders
  },
  relatedVideoThumbnail: {
    width: 120, // Adjust as needed
    height: 67, // Maintain 16:9 or desired aspect ratio
    flexShrink: 0,
    backgroundColor: colors.surface, // Placeholder color
  },
  relatedVideoContent: {
    flex: 1,
    padding: 8,
    justifyContent: "center", // Or 'space-between'
  },
  relatedVideoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  relatedVideoCreator: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 1,
  },
  relatedVideoStats: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
});

export default TipTubeScreen;