import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import axios from "axios";

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

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;

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

const Home = () => {
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [postViewCount, setPostViewCount] = useState<number>(0);
  const { isAuthenticated, user } = useAuth();
  const [feedData, setFeedData] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const userId = user?.id || null;
  const token = user?.accessToken || null;

  // Log component rendering and authentication status
  useEffect(() => {
    console.log("Rendering Home component", {
      isAuthenticated,
      userId,
      token,
      selectedCategory,
      page,
      localStorage: {
        adtip_user: localStorage.getItem("adtip_user"),
      },
      baseUrl: BASE_URL,
    });
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
    const abortController = new AbortController();
    try {
      console.log("Sending /api/getfunds request:", {
        url: `${BASE_URL}/getfunds/${userId}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await axios.get<WalletResponse>(
        `${BASE_URL}/getfunds/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        }
      );

      console.log("getfunds response:", {
        status: response.data.status,
        message: response.data.message,
        balance: response.data.availableBalance,
      });

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
    return () => abortController.abort();
  }, [isAuthenticated, userId, token]);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    // If not authenticated, fetch premium posts for guests
    if (!isAuthenticated) {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${BASE_URL}/list-premium-posts`);
        if (response.data.status && Array.isArray(response.data.data)) {
          setFeedData(response.data.data);
          setTotalPages(1); // No pagination for guest premium posts
        } else {
          setFeedData([]);
          setError("No premium posts available for guests.");
        }
      } catch (err: any) {
        setFeedData([]);
        setError("Failed to load premium posts. Please try again later.");
      } finally {
        setLoading(false);
      }
      return;
    }
    const abortController = new AbortController();
    try {
      setLoading(true);
      setError(null);
      const categoryObj = popularCategories.find((cat) => cat.name === selectedCategory);
      const categoryId = categoryObj ? categoryObj.id : 0;
      const payload = {
        category: categoryId,
        page: String(page),
        limit: "5",
        loggined_user_id: userId ? String(userId) : "0",
      };
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/list-posts`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
          signal: abortController.signal,
        }
      );
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
        setFeedData(sanitizedPosts);
        setTotalPages(response.data.pagination.total_page);
      } else {
        throw new Error(response.data.message || "Failed to fetch posts");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(
        err.message === "Network Error"
          ? "Unable to connect to the server. Please check your internet connection."
          : err.response?.data?.message || err.message || "Failed to load posts"
      );
    } finally {
      setLoading(false);
    }
    return () => abortController.abort();
  }, [isAuthenticated, userId, token, selectedCategory, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Check if user is viewing posts and prompt login
  useEffect(() => {
    if (!isAuthenticated && postViewCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [postViewCount, isAuthenticated]);

  const handlePostClick = (id: number) => {
    console.log("Post clicked:", { postId: id });
    if (!isAuthenticated) {
      setPostViewCount((prevCount) => prevCount + 1);
    }
  };

  return (
    <div className="pb-20 md:pb-0 bg-gray-50">
      {showLoginPrompt && (
        <VideoLoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}

      {isAuthenticated && walletBalance !== null && (
        <div className="bg-white sticky top-[60px] md:top-[57px] z-20 py-3 px-4 shadow-sm">
          <div className="max-w-screen-md mx-auto flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              Wallet Balance: ₹{walletBalance}
            </span>
            <Link to="/add-funds">
              <Button variant="outline" size="sm" className="teal-button">
                Add Funds
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white sticky top-[104px] md:top-[101px] z-10 py-3 px-4 overflow-x-auto flex whitespace-nowrap gap-3 no-scrollbar shadow-sm">
        {popularCategories.map((category) => (
          <button
            key={category.name}
            onClick={() => {
              setSelectedCategory(category.name);
              setPage(1);
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

      <div className="max-w-screen-md mx-auto pt-4 px-4">
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
            <div className="mb-6 bg-gradient-to-r from-adtip-teal to-[#13b799] rounded-lg p-4 text-white">
              <h3 className="font-bold text-lg mb-1">Refer & Earn!</h3>
              <p className="text-sm mb-3">
                Get ₹3 for every successful referral and earn ₹30 for each premium upgrade
              </p>
              <Button variant="secondary" size="sm">
                Share Now
              </Button>
            </div>

            {loading && (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
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

            {!loading && !error && feedData.length > 0 && (
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
                      <img
                        src={post.user_profile_image || "https://via.placeholder.com/40"}
                        alt={post.user_name || "User"}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300"
                      />
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
                            poster={post.thumbnail || "https://via.placeholder.com/640x800"}
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
                        <div className="flex items-center gap-1">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          <span className="text-xs">{post.likeCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/></svg>
                          <span className="text-xs">{post.commentCount}</span>
                        </div>
                        <div className="ml-auto text-xs text-gray-400">{post.views || 0} views</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && feedData.length > 0 && (
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="teal-button"
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages}
                  className="teal-button"
                >
                  Next
                </Button>
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
    </div>
  );
};

export default Home;