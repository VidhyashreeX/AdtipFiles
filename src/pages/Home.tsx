import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthUser, useIsAuthenticated, useAuthLoading } from "../stores/auth.store";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import { useParams } from 'react-router-dom';
import { FiShare2 } from "react-icons/fi"; // Feather's clean share icon
import axios, { AxiosError } from "axios";
import RandomAvatar, { getRandomAvatar } from "../components/RandomAvatar";
import ShareModal from "@/components/ShareModal";
import CommentsModal from "@/components/modals/CommentsModal";
import { getSafeImageUrl, handleImageError, createPlaceholderImage } from "../utils/imageUtils";
import { contentAPI, userAPI } from "../services/api";
import { useUIStore } from "../stores/ui.store";
import BannerCarousel from "../components/BannerCarousel";
import CategorySelector from "../components/CategorySelector";
import WalletBalance from "../components/WalletBalance";
import { popularCategories } from "../components/CategorySelector";
import { usePosts, usePost, useLikePost } from "@/hooks/api";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";

// Define TypeScript interfaces
interface User {
  id: string;
  accessToken: string;
}

interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  media_url: string;
  media_type: "video" | "image";
  is_promoted: number;
  video_category_id: number;
  user_name: string | null;
  user_profile_image: string | null;
  address: string | null;
  category_name: string;
  post_promotion_id: number | null;
  target_min_age: number | null;
  target_max_age: number | null;
  reach_goal: number | null;
  duration_days: number | null;
  pay_per_view: string | null;
  total_pay: string | null;
  platform_fee: string | null;
  likeCount: number;
  commentCount: number;
  is_liked: boolean;
  thumbnail?: string;
  duration?: string;
  views?: number;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: Post[];
  pagination: {
    current_page: number;
    total_page: number;
    total_count: number;
  };
}

interface WalletResponse {
  status: number;
  message: string;
  availableBalance: string;
}

interface ApiErrorResponse {
  message?: string;
  [key: string]: unknown;
}

const Home = () => {
  const openAuthModal = useUIStore((state) => state.openAuthModal);
  const { postId } = useParams<{ postId?: string }>();
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCopied, setShowCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
const [selectedPost, setSelectedPost] = useState<{ id: number } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<{
    id: number;
    user_name: string;
    content: string;
  } | null>(null);
  const [doubleTapTimers, setDoubleTapTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});

  const handlePostShare = (post: { id: number }) => {
  if (!post?.id) {
    console.error("Cannot share: post ID is missing or invalid", post);
    return;
  }
  setSelectedPost(post);
  setShareOpen(true);
};

  const handlePostComments = (post: { id: number; user_name: string; content: string }) => {
    setSelectedPostForComments(post);
    setCommentsOpen(true);
  };

  const handlePostLike = async (post: Post) => {
    if (!user?.id) {
      openAuthModal();
      return;
    }

    try {
      await likePostMutation.mutateAsync({
        postId: post.id,
        isLiked: post.is_liked
      });
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleDoubleTapLike = useCallback((post: Post) => {
    // Clear existing timer for this post
    if (doubleTapTimers[post.id]) {
      clearTimeout(doubleTapTimers[post.id]);
      delete doubleTapTimers[post.id];
      // Double tap detected - like the post
      handlePostLike(post);
      return;
    }

    // Set timer for double tap detection
    const timer = setTimeout(() => {
      // Single tap - just clear the timer
      setDoubleTapTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[post.id];
        return newTimers;
      });
    }, 300); // 300ms window for double tap

    setDoubleTapTimers(prev => ({
      ...prev,
      [post.id]: timer
    }));
  }, [doubleTapTimers, handlePostLike]);

  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [postViewCount, setPostViewCount] = useState<number>(0);
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();

  // Use React Query for data fetching
  const categoryObj = popularCategories.find(cat => cat.name === selectedCategory);
  const categoryId = categoryObj ? categoryObj.id : 0;

  // Fetch posts using React Query
  const {
    data: postsData,
    isLoading: loading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePosts({
    category: categoryId.toString(),
    user_id: user?.id || 0,
    limit: 5,
  });

  // Like mutation
  const likePostMutation = useLikePost();

  // Fetch single post if postId is provided
  const { data: singlePostData, isLoading: singlePostLoading } = usePost(
    postId ? parseInt(postId) : 0,
    user?.id,
    !!postId
  );

  // Flatten posts data for easier handling
  const feedData = postsData?.pages.flatMap(page => page.data).filter(post => post != null) || [];
  const error = postsError ? (postsError as Error).message : null;

  // Handle single post view
  const displayData = postId && singlePostData ? [singlePostData] : feedData;

  const userId = user?.id || null;
  const token = user?.accessToken || null;



  // Log component rendering and authentication status
  useEffect(() => {
    // console.log("Rendering Home component", {
    //   isAuthenticated,
    //   userId,
    //   token,
    //   selectedCategory,
    //   page,
    //   localStorage: {
    //     adtip_user: localStorage.getItem("adtip_user"),
    //   },

    // });
    if (!isAuthenticated || !userId || !token) {
      console.warn("User not authenticated or missing data, skipping fetch", {
        isAuthenticated,
        userId,
        token,
      });
      // Error handling is now managed by React Query
    }
  }, [isAuthenticated, userId, token]);

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  // Update refs when values change
  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Stable callback for intersection observer
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // If the loading element is visible and we can load more
    if (entries[0].isIntersecting && hasNextPageRef.current && !isFetchingNextPageRef.current) {
      fetchNextPageRef.current(); // Load more posts
    }
  }, []); // No dependencies - use refs for current values

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1 // Lower threshold for better detection
    });

    observerRef.current = observer;

    // Observe the 4th last post if it exists and we have more than 4 posts
    if (loadingRef.current && displayData.length >= 4) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, displayData.length]); // Re-run when displayData length changes

  // Check if user is viewing posts and prompt login
  useEffect(() => {
    if (!isAuthenticated && postViewCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [postViewCount, isAuthenticated]);

  const handlePostClick = (id: number) => {
    // console.log("Post clicked:", { postId: id });
    if (!isAuthenticated) {
      setPostViewCount((prevCount) => prevCount + 1);
    }
  };

  return (
    <div className="pb-20 md:pb-0 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Categories Bar - Floating Glassmorphic Chips */}
      <CategorySelector
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onResetFeed={() => {
          // React Query will automatically refetch when selectedCategory changes
        }}
      />

      {/* Banner Carousel - Hidden */}
      {/* <BannerCarousel userId={userId} isAuthenticated={isAuthenticated} /> */}

      {/* Main scrollable content below fixed bars */}
      <div className="max-w-[480px] lg:max-w-[640px] mx-auto px-0 md:px-4"
        style={{ paddingTop: 'calc(var(--navbar-height, 56px) + 24px)' }}
      >
        <Tabs defaultValue="for-you" className="mb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="for-you" onClick={() => setActiveTab("for-you")}>
              For You
            </TabsTrigger>
            <TabsTrigger
              value="following"
              onClick={() => setActiveTab("following")}
            >
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="for-you">
            {/* Carousel Banner 
            <BannerCarousel userId={userId} isAuthenticated={isAuthenticated} /> */}

            {loading && displayData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            )}

            {error && displayData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => refetch()} className="mt-4">
                  Retry
                </Button>
              </div>
            )}

            {!loading && !error && displayData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">
                  {selectedCategory === "All"
                    ? "No posts available at the moment."
                    : `No posts available for ${selectedCategory}. Try another category.`}
                </p>
                <Button
                  onClick={() => setSelectedCategory("All")}
                  className="mt-4 teal-button"
                >
                  View All Posts
                </Button>
              </div>
            )}

            {!error && displayData.length > 0 && (
              <div className="space-y-4">
                {displayData.map((post, index) => (
                  <div
                    key={post.id}
                    ref={index === displayData.length - 4 ? loadingRef : undefined} // Observe 4th last post
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6 rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.user_profile_image ? (
                          <img
                            src={getSafeImageUrl(post.user_profile_image)}
                            alt={post.user_name || "User"}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                            onError={(e) => {
                              handleImageError(e);
                            }}
                          />
                        ) : (
                          <RandomAvatar
                            seed={post.user_id || post.user_name || post.id}
                            alt={post.user_name || "User"}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.user_name}</span>
                            {post.is_promoted && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">• Sponsored</span>
                            )}
                          </div>
                          {post.address && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{post.address}</span>
                          )}
                        </div>
                      </div>
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                    </div>
                    {/* Media */}
                    <div
                      className="relative bg-black cursor-pointer"
                      onClick={() => handleDoubleTapLike(post)}
                    >
                      {post.media_type === "video" && post.media_url ? (
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                          <video
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            poster={post.thumbnail || undefined}
                          >
                            <source src={post.media_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          {post.duration && (
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                              {post.duration}
                            </div>
                          )}
                        </div>
                      ) : post.media_type === "image" && post.media_url ? (
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                          <img
                            src={getSafeImageUrl(post.media_url)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              handleImageError(e);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 7v10h16V7H4zm8 2l5 4H7l5-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Action bar - Instagram Style */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePostLike(post);
                            }}
                            className="group relative"
                            disabled={likePostMutation.isPending}
                          >
                            <Heart
                              className={`w-6 h-6 transition-all duration-200 ${
                                post.is_liked
                                  ? 'text-red-500 fill-red-500'
                                  : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                              }`}
                              fill={post.is_liked ? "currentColor" : "none"}
                              strokeWidth={post.is_liked ? "0" : "1.5"}
                            />
                          </button>

                          {/* Comment Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePostComments({
                                id: post.id,
                                user_name: post.user_name || "User",
                                content: post.content
                              });
                            }}
                            className="group"
                          >
                            <MessageCircle
                              className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors"
                              strokeWidth="1.5"
                            />
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePostShare(post);
                            }}
                            className="group"
                          >
                            <Send
                              className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors"
                              strokeWidth="1.5"
                            />
                          </button>
                        </div>

                        {/* Bookmark */}
                        <button className="group">
                          <Bookmark
                            className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors"
                            strokeWidth="1.5"
                          />
                        </button>
                      </div>

                      {/* Likes count */}
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                        {(post.likeCount || 0).toLocaleString()} likes
                      </div>

                      {/* Caption */}
                      <div className="text-sm mb-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 mr-2">{post.user_name}</span>
                        <span className="text-gray-900 dark:text-gray-100">{post.content}</span>
                      </div>

                      {/* View comments */}
                      {(post.commentCount || 0) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostComments({
                              id: post.id,
                              user_name: post.user_name || "User",
                              content: post.content
                            });
                          }}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          View all {(post.commentCount || 0)} comments
                        </button>
                      )}

                      {/* Views count */}
                      {post.views && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {post.views.toLocaleString()} views
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show loading indicator when fetching next page */}
            {isAuthenticated && hasNextPage && isFetchingNextPage && (
              <div className="flex justify-center py-8">
                <p className="text-gray-500">Loading more posts...</p>
              </div>
            )}

            {isAuthenticated && !hasNextPage && displayData.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No more posts to load</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following">
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold mb-4">
                Start following creators
              </h3>
              <p className="text-gray-500 mb-6">
                Follow creators to see their content in your feed
              </p>
              <Link to="/discover">
                <Button className="teal-button">Discover Creators</Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Google Play Store Banner - fixed bottom right, desktop only */}
      <div
        className="hidden md:flex fixed z-40 bottom-6 right-6 items-center gap-0 select-none"
        style={{ pointerEvents: 'auto' }}
      >
        <a
          href="https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app&hl=en_IN"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center group"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="rounded-l-2xl pl-5 pr-4 py-3 flex items-center bg-gradient-to-r from-[#e0e7ef] via-[#d1f1e6] to-[#f7e7fa] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 shadow-lg border border-border hover:from-[#d1e7f7] hover:to-[#e7f7e7] dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors duration-300"
            style={{ minWidth: 120 }}
          >
            <span className="font-semibold text-foreground text-base tracking-wide drop-shadow-sm mr-2">Install now</span>
          </div>
          <div
            className="rounded-r-2xl bg-card p-2 pl-1 pr-3 flex items-center shadow-lg border-t border-b border-r border-border hover:bg-muted transition-colors duration-300"
          >
            <img
              src="/playstore.png"
              alt="Google Play Store"
              className="w-8 h-8 object-contain mr-1 dark:brightness-90"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
            />
          </div>
        </a>
      </div>

      {/* Google Play Store Logo - fixed bottom right, mobile only */}
      <a
        href="https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app&hl=en_IN"
        target="_blank"
        rel="noopener noreferrer"
        className="flex md:hidden fixed z-40 right-5 items-center select-none"
        style={{ pointerEvents: 'auto', bottom: '10%' }}
      >
        <img
          src="/playstore.png"
          alt="Google Play Store"
          className="w-14 h-14 object-contain drop-shadow-lg rounded-2xl border border-border bg-card p-2 dark:brightness-90"
        />
      </a>
{selectedPost && (
  <ShareModal
    shareUrl={`${window.location.origin}/post/${selectedPost.id}`}
    open={shareOpen}
    onClose={() => setShareOpen(false)}
  />
)}

{selectedPostForComments && (
  <CommentsModal
    postId={selectedPostForComments.id}
    open={commentsOpen}
    onClose={() => setCommentsOpen(false)}
    postAuthor={selectedPostForComments.user_name}
    postContent={selectedPostForComments.content}
  />
)}

    </div>
  );
};

export default Home;