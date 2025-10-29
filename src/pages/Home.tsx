import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import { useParams } from 'react-router-dom';
import { FiShare2 } from "react-icons/fi"; // Feather's clean share icon
import axios, { AxiosError } from "axios";
import RandomAvatar, { getRandomAvatar } from "../components/RandomAvatar";
import ShareModal from "@/components/ShareModal";
import { getSafeImageUrl, handleImageError, createPlaceholderImage } from "../utils/imageUtils";
import { contentAPI, userAPI } from "../services/api";
import { useAuthModal } from "../contexts/AuthModalContext";
import BannerCarousel from "../components/BannerCarousel";
import CategorySelector from "../components/CategorySelector";
import WalletBalance from "../components/WalletBalance";
import { popularCategories } from "../components/CategorySelector";

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
  const { openLoginModal } = useAuthModal();
  const { id: postId } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCopied, setShowCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
const [selectedPost, setSelectedPost] = useState<{ id: number } | null>(null);

 const handlePostShare = (post: { id: number }) => {
  if (!post?.id) {
    console.error("Cannot share: post ID is missing or invalid", post);
    return;
  }
  setSelectedPost(post);
  setShareOpen(true);
};

  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [postViewCount, setPostViewCount] = useState<number>(0);
  const { isAuthenticated, user, authLoading } = useAuth();
  const [feedData, setFeedData] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

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
      setError("Please log in to view posts");
    }
  }, [isAuthenticated, userId, token]);

  // Fetch posts with infinite scroll
 
 const fetchPosts = useCallback(
    async (shouldAppend = false) => {
      // GUEST MODE — Only show premium posts when browsing normally (no postId)
      if (!isAuthenticated && !postId) {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/list-premium-posts`);
          if (response.data.status && Array.isArray(response.data.data)) {
            setFeedData(response.data.data);
            setPage(1);
            setHasMore(false);
          } else {
            setFeedData([]);
            setError("No premium posts available for guests.");
            setHasMore(false);
          }
        } catch {
          setFeedData([]);
          setError("Failed to load premium posts. Please try again later.");
          setHasMore(false);
        } finally {
          setLoading(false);
        }
        return;
      }
    if (!shouldAppend && loading) return; // Prevent multiple simultaneous initial loads
    if (shouldAppend && (!hasMore || loading)) return; // Don't fetch if no more data or already loading



      // Declare requestParams outside try block for error logging
      let requestParams: {
        category: number;
        page: number;
        limit: number;
        loggined_user_id: number;
      } | null = null;

      try {
        setLoading(true);
        setError(null);

        // --------------------------
        // SINGLE POST MODE (/post/:id)
        // --------------------------
        if (postId) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/post/${postId}`, {
            headers: isAuthenticated
              ? { Authorization: `Bearer ${token}` }
              : {},

          });

          if (response.data && response.data.status) {
            // Unwrap array from API
            const rawPost = Array.isArray(response.data.data)
              ? response.data.data[0]
              : response.data.data;

            const sanitizedPost = {
              ...rawPost,
              media_url: rawPost.media_url || "",
              user_name: rawPost.user_name || "Anonymous",
              user_profile_image: rawPost.user_profile_image || null,
              address: rawPost.address || "Location not provided",
              title: rawPost.title || "Untitled",
              content: rawPost.content || "No content",
            };

            setFeedData([sanitizedPost]); // Keep inside array for mapping in UI
            setPage(1);
            setHasMore(false);
          } else {
            setFeedData([]);
            setError("Post not found.");
            setHasMore(false);
          }
          return; // IMPORTANT: Stop here, don't load feed
        }

        // --------------------------
        // MULTI POST MODE (Feed view)
        // --------------------------
        const categoryObj = popularCategories.find(
          (cat) => cat.name === selectedCategory
        );
        const categoryId = categoryObj ? categoryObj.id : 0;

        requestParams = {
          category: categoryId,
          page: shouldAppend ? page : 1,
          limit: 5,
          loggined_user_id: userId || 0,
        };
        
        console.log('📤 Sending listPosts request:', requestParams);
        console.log('📤 Request headers:', {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'No token'
        });
        
        const response = await contentAPI.listPosts(requestParams);

        if (response.data.status) {
          const sanitizedPosts = response.data.data.map((post) => ({
            ...post,
            media_url: post.media_url || "",
            user_name: post.user_name || "Anonymous",
            user_profile_image: post.user_profile_image || null,
            address: post.address || "Location not provided",
            title: post.title || "Untitled",
            content: post.content || "No content",
          }));

          if (shouldAppend) {
            setFeedData((prev) => [...prev, ...sanitizedPosts]);
          } else {
            setFeedData(sanitizedPosts);
          }

          setHasMore(page < response.data.pagination.total_page);

          if (
            sanitizedPosts.length > 0 &&
            page < response.data.pagination.total_page
          ) {
            setPage((prevPage) => prevPage + 1);
          } else {
            setHasMore(false);
          }
        } else {
          throw new Error(response.data.message || "Failed to fetch posts");
        }
      } catch (err: unknown) {
        const error = err as AxiosError;
        if (error.name === "AbortError") return;
        
        console.error('❌ listPosts error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          requestParams: requestParams
        });
        
        setError(
          error.message === "Network Error"
            ? "Unable to connect to the server. Please check your connection."
            : (error.response?.data as ApiErrorResponse)?.message || error.message || "Failed to load posts"
        );
        setHasMore(false);
      } finally {
        setLoading(false);
      }


    },
    [
      isAuthenticated,
      userId,
      token,
      postId,
      selectedCategory
    ]
  );
    useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Initial data load
  useEffect(() => {
    // Reset state when category changes
    setFeedData([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(false);
  }, [selectedCategory, isAuthenticated]); // Only reload on category change or auth change

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If the loading element is visible and we can load more
        if (entries[0].isIntersecting && hasMore) {
          fetchPosts(true); // Load more posts
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the loading element is visible
    );
    
    observerRef.current = observer;
    
    // Observe the loading element if it exists
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchPosts, hasMore]); // Re-setup observer when fetchPosts or hasMore changes

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
          setPage(1);
          setFeedData([]);
          setHasMore(true);
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

            {loading && feedData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            )}

            {error && feedData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => {
                  setPage(1);
                  setHasMore(true);
                  fetchPosts(false);
                }} className="mt-4">
                  Retry
                </Button>
              </div>
            )}

            {!loading && !error && feedData.length === 0 && (
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

            {!error && feedData.length > 0 && (
              <div className="space-y-0">
                {feedData.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 cursor-pointer mb-4 md:mb-6 md:rounded-lg md:border md:shadow-sm"
                    onClick={() => handlePostClick(post.id)}
                  >
                    {/* Header */}
                    <div className="flex items-center px-3 py-2.5">
                      {post.user_profile_image ? (
                        <img
                          src={getSafeImageUrl(post.user_profile_image)}
                          alt={post.user_name || "User"}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                          onError={(e) => {
                            handleImageError(e);
                          }}
                        />
                      ) : (
                        <RandomAvatar
                          seed={post.user_id || post.user_name || post.id}
                          alt={post.user_name || "User"}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                        />
                      )}
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.user_name}</span>
                          {post.is_promoted && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">• Sponsored</span>
                          )}
                        </div>
                        {post.address && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{post.address}</span>
                        )}
                      </div>
                      <button className="ml-auto text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                    </div>
                    {/* Media */}
                    <div className="relative bg-black">
                      {post.media_type === "video" && post.media_url ? (
                        <div className="aspect-[4/5] bg-muted">
                          <video
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            poster={post.thumbnail || "thumbnail.png"}
                            style={{ borderRadius: 0 }}
                          >
                            <source src={post.media_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
                            {post.duration || "00:00"}
                          </div>
                        </div>
                      ) : post.media_type === "image" && post.media_url ? (
                        <div className="aspect-square bg-muted">
                          <img
                            src={post.media_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            style={{ borderRadius: 0 }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground">
                          No media available
                        </div>
                      )}
                    </div>
                    {/* Action bar - Instagram Style */}
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Like functionality here
                            }}
                            className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                          >
                            <svg className="w-7 h-7" fill={post.is_liked ? "red" : "none"} stroke={post.is_liked ? "red" : "currentColor"} strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </button>
                          
                          {/* Comment Button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Comment functionality here
                            }}
                            className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                            </svg>
                          </button>
                          
                          {/* Share Button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePostShare(post);
                            }}
                            className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                          >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5"/>
                            </svg>
                          </button>
                        </div>
                        
                        {/* Bookmark */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Bookmark functionality here
                          }}
                          className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                        >
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Likes count */}
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {(post.likeCount || 0).toLocaleString()} likes
                      </div>
                      
                      {/* Caption */}
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 mr-2">{post.user_name}</span>
                        <span className="text-gray-900 dark:text-gray-100">{post.content}</span>
                      </div>
                      
                      {/* View comments */}
                      {(post.commentCount || 0) > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // View comments functionality
                          }}
                          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
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
            
            {/* Infinite scroll loading indicator */}
            {isAuthenticated && hasMore && (
              <div 
                ref={loadingRef}
                className="flex justify-center py-8"
              >
                {loading && <p className="text-gray-500">Loading more posts...</p>}
                {!loading && <div className="h-8" />} {/* Invisible element for intersection observer */}
              </div>
            )}

            {isAuthenticated && !hasMore && feedData.length > 0 && (
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

    </div>
  );
};

export default Home;