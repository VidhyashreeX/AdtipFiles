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

const TipTubeScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null); // For press-in preview
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const navigation = useNavigation<any>(); // Use any to avoid navigation typing errors

  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDarkMode);

  // Transform API video data to match Video interface
  const transformVideoData = (apiVideo: any): Video => ({
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
  });

  // Fetch videos using ApiService
  const fetchVideos = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      const currentOffset = reset ? 1 : offset;
      let videoList: Video[] = [];
      try {
        if (user && user.id) {
          // Authenticated user
          const apiRes = await ApiService.getVideos(
            user.id,
            categoryToIdMap[selectedCategory] || 0,
            currentOffset
          );
          if (apiRes && Array.isArray(apiRes.data)) {
            videoList = apiRes.data.map(transformVideoData);
          }
        } else {
          // Public API fallback: use userId 0 for public videos
          const apiRes = await ApiService.getVideos(
            0,
            categoryToIdMap[selectedCategory] || 0,
            currentOffset
          );
          if (apiRes && Array.isArray(apiRes.data)) {
            videoList = apiRes.data.map(transformVideoData);
          }
        }
        setVideos((prev) => (reset ? videoList : [...prev, ...videoList]));
        setHasMore(videoList.length > 0);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, offset, user, loading]
  );

  // Initial fetch and on category/search change
  useEffect(() => {
    setOffset(1);
    fetchVideos(true);
  }, [selectedCategory, search, fetchVideos]);

  // Infinite scroll logic for ScrollView
  const handleScroll = useCallback(
    ({ nativeEvent }: { nativeEvent: any }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const paddingToBottom = 400;
      if (
        contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom &&
        !loading &&
        hasMore
      ) {
        setOffset((prev) => prev + 1);
      }
    },
    [loading, hasMore]
  );

  useEffect(() => {
    if (offset > 1) fetchVideos();
  }, [offset, fetchVideos]);

  // Video player modal logic
  const openPlayer = (video: Video) => {
    setCurrentVideo(video);
    setShowPlayerModal(true);
  };
  const closePlayer = () => {
    setShowPlayerModal(false);
    setCurrentVideo(null);
  };

  // Video card rendering with press-in/press-out preview
  const renderVideoCard = (video: Video) => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      onPress={() => openPlayer(video)}
      onPressIn={() => setPreviewingVideoId(video.id)}
      onPressOut={() => setPreviewingVideoId(null)}
    >
      <View style={styles.thumbnailContainer}>
        {/* Price badge if paid */}
        {video.price && video.price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{video.price}</Text>
          </View>
        )}
        {/* Show video on active press, else show thumbnail */}
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
              onPress={() => navigation.navigate("Channel", { channelId: video.channelId })}
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

  return (
    <View style={styles.container}>
      <Header title="TipTube" showLogo={true} />      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Optimize scroll event frequency
        contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]}
      >
        {/* Category Filter (You'd typically have a horizontal scroll view here) */}
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

        {/* Video Grid */}
        <View style={styles.videoGrid}>
          {videos.map(renderVideoCard)}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00C896" />
            <Text style={styles.loadingText}>Loading more...</Text>
          </View>
        )}

        {!loading && !hasMore && videos.length === 0 && (
          <View style={styles.noVideosContainer}>
            <Text style={styles.noVideosText}>No videos found.</Text>
          </View>
        )}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePlayer}
      >
        <View style={styles.playerModalContainer}>
          {currentVideo && (
            <>
              <Video
                source={{ uri: currentVideo.videoUrl }}
                style={styles.mainVideoPlayer}
                controls={true} // react-native-video provides its own controls
                paused={!showPlayerModal} // Pause when modal is not visible
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
                      onPress={() => navigation.navigate("Channel", { channelId: currentVideo.channelId })}
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

              {/* Relevant Videos Sidebar (adapted for RN layout, perhaps a vertical list below main video on small screens or a separate section) */}
              <View style={styles.relatedVideosSection}>
                <Text style={styles.relatedVideosTitle}>Up Next</Text>
                {videos.filter(v => v.id !== currentVideo.id).map((video, idx) => (
                  <TouchableOpacity
                    key={video.id}
                    style={styles.relatedVideoCard}
                    onPress={() => setCurrentVideo(video)} // Change current video in modal
                  >
                    <Image
                      source={{ uri: video.thumbnail || "https://via.placeholder.com/120x67" }}
                      style={styles.relatedVideoThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedVideoContent}>
                      <Text style={styles.relatedVideoTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={styles.relatedVideoCreator}>{video.creatorName}</Text>
                      <Text style={styles.relatedVideoStats}>
                        {video.views.toLocaleString()} views • {video.posted}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

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
    color: "#00C896", // adtip-teal
    fontWeight: "500", // font-medium
    marginTop: 8,
  },
  noVideosContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  noVideosText: {
    color: colors.text.tertiary,
    fontSize: 16,
  },

  // Player Modal Styles
  playerModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    flex: 1, // Take remaining space in column layout
    padding: 16,
  },
  relatedVideosTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: colors.text.primary,
  },
  relatedVideoCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 8, // rounded-lg
    shadowColor: isDarkMode ? "#000" : "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12, // gap-3
    overflow: "hidden",
  },
  relatedVideoThumbnail: {
    width: 144, // w-36
    height: 80, // h-20
    flexShrink: 0,
  },
  relatedVideoContent: {
    flex: 1,
    padding: 8, // py-2 pr-2
    justifyContent: "space-between",
  },
  relatedVideoTitle: {
    fontSize: 14, // text-sm
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  relatedVideoCreator: {
    fontSize: 12, // text-xs
    color: colors.text.secondary,
  },
  relatedVideoStats: {
    fontSize: 10, // text-xs
    color: colors.text.tertiary,
  },
});

export default TipTubeScreen;