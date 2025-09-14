import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import { useParams } from 'react-router-dom';
import { FiShare2 } from "react-icons/fi"; // Feather's clean share icon
import axios from "axios";
import RandomAvatar, { getRandomAvatar } from "../components/RandomAvatar";
import ShareModal from "@/components/ShareModal";
import { getSafeImageUrl, handleImageError, createPlaceholderImage } from "../utils/imageUtils";
import { contentAPI, userAPI } from "../services/api";

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



const popularCategories = [
  { name: "All", id: 0 },
  { name: "Art", id: 9 },
  { name: "Beauty", id: 10 },
  { name: "Business", id: 11 },
  { name: "Fashion", id: 12 },
  { name: "Fitness", id: 14 },
  { name: "Food", id: 15 },
  { name: "Gaming", id: 16 },
  { name: "Music", id: 17 },
  { name: "Tech", id: 20 },
  { name: "Travel", id: 21 },
];

const bannerData = [
  {
    title: "Watch & Earn",
    description: "Earn rewards by watching videos",
    gradient: "from-[#7F7FD5] via-[#86A8E7] to-[#91EAE4]",
    icon: "🎬",
  },
  {
    title: "Play & Earn",
    description: "Earn money by playing games",
    gradient: "from-[#43e97b] via-[#38f9d7] to-[#38f9d7]",
    icon: "🎮",
  },
  {
    title: "Refer & Earn",
    description: "Invite friends and earn bonuses",
    gradient: "from-[#f7971e] via-[#ffd200] to-[#f7971e]",
    icon: "🤝",
  },
];

/*const BannerCarousel = ({ userId, isAuthenticated }: { userId: string | number | null, isAuthenticated: boolean }) => {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % bannerData.length);
    }, 4000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [current]);
  const handleEarnClick = () => {
    if (isAuthenticated && userId) {
      window.open(`https://wow.pubscale.com/?app_id=39604779&user_id=${userId}`, "_blank");
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-6">
      <div
        className={`rounded-2xl p-6 flex items-center justify-between shadow-lg bg-gradient-to-r ${bannerData[current].gradient} transition-all duration-700`}
      >
        <div>
          <div className="text-3xl mb-2">{bannerData[current].icon}</div>
          <h3 className="font-bold text-lg mb-1 text-white drop-shadow">{bannerData[current].title}</h3>
          <p className="text-white/90 text-sm mb-3 drop-shadow">{bannerData[current].description}</p>
          <button
            onClick={handleEarnClick}
            className="px-6 py-2 rounded-full font-bold text-white bg-gradient-to-r from-[#ff512f] to-[#dd2476] shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            Earn
          </button>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {bannerData.map((_, idx) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full ${idx === current ? "bg-white/90" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
};*/

const Home = () => {
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
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const { postId } = useParams();
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

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!isAuthenticated || !userId || !token) {
      return;
    }

    try {

      const response = await userAPI.getWalletBalance(String(userId!));

      // console.info("getfunds response:", {
      //   status: response.data.status,
      //   message: response.data.message,
      //   balance: response.data.availableBalance,
      // });

      if (response.data.status === 200) {
        setWalletBalance(response.data.availableBalance);
      } else {
        throw new Error(response.data.message || "Failed to fetch wallet balance");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("getfunds error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setWalletBalance(null);
    }

  }, [isAuthenticated, userId, token]);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

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
      let requestParams: any = null;

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
      } catch (err: any) {
        if (err.name === "AbortError") return;
        
        console.error('❌ listPosts error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          requestParams: requestParams
        });
        
        setError(
          err.message === "Network Error"
            ? "Unable to connect to the server. Please check your connection."
            : err.response?.data?.message || err.message || "Failed to load posts"
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
    <div className="pb-20 md:pb-0 bg-gray-50">
      {/* Categories Bar - fixed below navbar, not scrollable, always visible */}
      <div className="bg-white fixed left-0 right-0 z-30 py-3 px-4 overflow-x-auto flex justify-center whitespace-nowrap gap-3 no-scrollbar shadow-sm border-b border-gray-100"
        style={{ top: 'calc(var(--navbar-height, 56px) + 20px)' }}
      >
        <div className="flex gap-3">
          {popularCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setSelectedCategory(category.name);
                setPage(1);
                setFeedData([]);
                setHasMore(true);
              }}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                selectedCategory === category.name
                  ? "bg-adtip-teal text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main scrollable content below fixed bars */}
      <div className="max-w-screen-md mx-auto px-4"
        style={{ paddingTop: 'calc(var(--navbar-height, 56px) + 48px)' }}
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
              <div className="space-y-6">
                {feedData.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer max-w-[420px] mx-auto"
                    style={{ marginBottom: 24 }}
                    onClick={() => handlePostClick(post.id)}
                  >
                    {/* Header */}
                    <div className="flex items-center px-3 py-2">
                      {post.user_profile_image ? (
                        <img
                          src={getSafeImageUrl(post.user_profile_image)}
                          alt={post.user_name || "User"}
                          className="w-8 h-8 rounded-full object-cover border border-gray-300"
                          onError={(e) => {
                            handleImageError(e);
                          }}
                        />
                      ) : (
                        <RandomAvatar
                          seed={post.user_id || post.user_name || post.id}
                          alt={post.user_name || "User"}
                          className="w-8 h-8 rounded-full object-cover border border-gray-300"
                        />
                      )}
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm text-gray-900">{post.user_name}</span>
                          {post.is_promoted ? (
                            <span className="ml-1 text-xs text-adtip-teal font-medium">• Sponsored</span>
                          ) : null}
                        </div>
                        <span className="text-xs text-gray-400">{post.address}</span>
                      </div>
                      <button className="ml-auto text-gray-400 hover:text-gray-600 text-xl px-2">•••</button>
                    </div>
                    {/* Media */}
                    <div className="relative bg-black">
                      {post.media_type === "video" && post.media_url ? (
                        <div className="aspect-[4/5] bg-gray-200">
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
                        <div className="aspect-square bg-gray-200">
                          <img
                            src={post.media_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            style={{ borderRadius: 0 }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-500">
                          No media available
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="px-3 pt-2 pb-3">
                      <h4 className="font-medium text-sm mb-1 text-gray-900 line-clamp-2">{post.title}</h4>
                      <p className="text-xs text-gray-700 mb-2 line-clamp-3">{post.content}</p>
          {/* Action bar */}
<div className="flex items-center gap-6 text-gray-600 text-sm mt-2">
  {/* Likes */}
  <div className="flex items-center gap-1">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
               c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
    <span className="text-xs">{post.likeCount}</span>
  </div>

  {/* Comments */}
  <div className="flex items-center gap-1">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5
               a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/>
    </svg>
    <span className="text-xs">{post.commentCount}</span>
  </div>

  {/* Share */}
 <button
  onClick={() => handlePostShare(post)}
  className="flex items-center gap-1 hover:text-blue-500 transition-colors duration-200"
>
  <FiShare2 className="w-5 h-5" />
  <span className="text-xs">Share</span>
</button>


  {/* Views */}
  <div className="ml-auto text-xs text-gray-400">{post.views || 0} views</div>
</div>


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
            className="rounded-l-2xl pl-5 pr-4 py-3 flex items-center bg-gradient-to-r from-[#e0e7ef] via-[#d1f1e6] to-[#f7e7fa] shadow-lg border border-gray-200 hover:from-[#d1e7f7] hover:to-[#e7f7e7] transition-colors duration-300"
            style={{ minWidth: 120 }}
          >
            <span className="font-semibold text-gray-700 text-base tracking-wide drop-shadow-sm mr-2">Install now</span>
          </div>
          <div
            className="rounded-r-2xl bg-white p-2 pl-1 pr-3 flex items-center shadow-lg border-t border-b border-r border-gray-200 hover:bg-gray-50 transition-colors duration-300"
          >
            <img
              src="/playstore.png"
              alt="Google Play Store"
              className="w-8 h-8 object-contain mr-1"
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
          className="w-14 h-14 object-contain drop-shadow-lg rounded-2xl border border-gray-200 bg-white p-2"
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