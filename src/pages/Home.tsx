
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";
import axios from "axios";

// Define TypeScript interfaces
interface User {
  id: number;
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
  user_name: string;
  user_profile_image: string | null;
  address: string;
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

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;

// Sample data for popular categories
const popularCategories = [
  "All",
  "Art",
  "Beauty",
  "Business",
  "Fashion",
  "Fitness",
  "Food",
  "Gaming",
  "Music",
  "Tech",
  "Travel",
];

const Home = () => {
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [postViewCount, setPostViewCount] = useState<number>(0);
  const { isAuthenticated, user } = useAuth();
  const [feedData, setFeedData] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch posts from /api/list-posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id || !user?.accessToken) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post<ApiResponse>(
          `${BASE_URL}/list-posts`,
          {
            category: selectedCategory === "All" ? 0 : selectedCategory,
            page: page,
            limit: 5,
            loggined_user_id: user.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        );
        console.log("list-posts response:", response.data); // Debug log
        if (response.data.status) {
          setFeedData(response.data.data);
          setTotalPages(response.data.pagination.total_page);
        } else {
          throw new Error(response.data.message || "Failed to fetch posts");
        }
      } catch (err: any) {
        console.error("list-posts error:", err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, selectedCategory, page]);

  // Check if user is viewing posts and prompt login after a few posts
  useEffect(() => {
    if (!isAuthenticated && postViewCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [postViewCount, isAuthenticated]);

  const handlePostClick = (id: number) => {
    // Increase view count for non-authenticated users
    if (!isAuthenticated) {
      setPostViewCount((prevCount) => prevCount + 1);
    }
  };

  return (
    <div className="pb-20 md:pb-0 bg-gray-50">
      {/* Show login prompt if needed */}
      {showLoginPrompt && (
        <VideoLoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}

      {/* Categories horizontal scroll - Made sticky with different z-index */}
      <div className="bg-white sticky top-[60px] md:top-[57px] z-10 py-3 px-4 overflow-x-auto flex whitespace-nowrap gap-3 no-scrollbar shadow-sm">
        {popularCategories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setPage(1); // Reset page on category change
            }}
            className={`px-4 py-1.5 rounded-full text-sm transition-all ${
              selectedCategory === category
                ? "bg-adtip-teal text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-screen-md mx-auto pt-4 px-4">
        {/* Tabs */}
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

          {/* For You Tab */}
          <TabsContent value="for-you">
            {/* Referral Banner */}
            <div className="mb-6 bg-gradient-to-r from-adtip-teal to-[#13b799] rounded-lg p-4 text-white">
              <h3 className="font-bold text-lg mb-1">Refer & Earn!</h3>
              <p className="text-sm mb-3">
                Get ₹3 for every successful referral and earn ₹30 for each premium
                upgrade
              </p>
              <Button variant="secondary" size="sm">
                Share Now
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-10">
                <p className="text-red-500">Error: {error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Retry
                </Button>
              </div>
            )}

            {/* Feed Posts */}
            {!loading && !error && feedData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500">No posts available at the moment.</p>
              </div>
            )}

            {!loading && !error && feedData.length > 0 && (
              <div className="space-y-6">
                {feedData.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                    onClick={() => handlePostClick(post.id)}
                  >
                    {/* Post header */}
                    <div className="flex items-center p-4">
                      <img
                        src={
                          post.user_profile_image ||
                          "https://via.placeholder.com/40"
                        }
                        alt={post.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <h3 className="font-semibold">{post.user_name}</h3>
                        </div>
                        <p className="text-xs text-gray-500">
                          {post.is_promoted ? "Sponsored" : "Posted recently"}
                        </p>
                      </div>
                      <button className="ml-auto text-gray-500">•••</button>
                    </div>

                    {/* Post content */}
                    <div className="relative">
                      {post.media_type === "video" && post.media_url ? (
                        <div className="aspect-video bg-gray-200">
                          <video
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            poster={
                              post.thumbnail ||
                              "https://via.placeholder.com/640x360"
                            }
                          >
                            <source src={post.media_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
                            {post.duration || "00:00"}
                          </div>
                        </div>
                      ) : post.media_type === "image" && post.media_url ? (
                        <img
                          src={post.media_url}
                          alt="Post"
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-500">
                          No media available
                        </div>
                      )}
                    </div>

                    {/* Post description */}
                    <div className="p-4">
                      <p className="text-sm">{post.content}</p>

                      {/* Post stats */}
                      <div className="flex items-center mt-4 text-sm text-gray-500">
                        <div className="flex items-center mr-4">
                          <svg
                            className="w-4 h-4 mr-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          {post.likeCount}
                        </div>
                        <div className="flex items-center mr-4">
                          <svg
                            className="w-4 h-4 mr-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
                          </svg>
                          {post.commentCount}
                        </div>
                        <div className="ml-auto text-xs">
                          {post.views || 0} views
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
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

          {/* Following Tab */}
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
