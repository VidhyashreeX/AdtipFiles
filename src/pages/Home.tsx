import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import VideoLoginPrompt from "../components/VideoLoginPrompt";

// Sample data for popular categories (kept as-is since no API was provided for categories)
const popularCategories = [
  "All", "Art", "Beauty", "Business", "Fashion", "Fitness", 
  "Food", "Gaming", "Music", "Tech", "Travel"
];

const Home = () => {
  const [activeTab, setActiveTab] = useState("for-you");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [postViewCount, setPostViewCount] = useState(0);
  const { isAuthenticated } = useAuth();
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch video data from the API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://3.6.15.198:7082/api/getvideos/51951/0/1");
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setFeedData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Check if user is viewing posts and prompt login after a few posts
  useEffect(() => {
    if (!isAuthenticated && postViewCount >= 2) {
      setShowLoginPrompt(true);
    }
  }, [postViewCount, isAuthenticated]);
  
  const handlePostClick = (id) => {
    // Increase view count for non-authenticated users
    if (!isAuthenticated) {
      setPostViewCount(prevCount => prevCount + 1);
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
            onClick={() => setSelectedCategory(category)}
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
            <TabsTrigger value="for-you" onClick={() => setActiveTab("for-you")}>For You</TabsTrigger>
            <TabsTrigger value="following" onClick={() => setActiveTab("following")}>Following</TabsTrigger>
          </TabsList>
          
          {/* For You Tab */}
          <TabsContent value="for-you">
            {/* Referral Banner */}
            <div className="mb-6 bg-gradient-to-r from-adtip-teal to-[#13b799] rounded-lg p-4 text-white">
              <h3 className="font-bold text-lg mb-1">Refer & Earn!</h3>
              <p className="text-sm mb-3">Get ₹3 for every successful referral and earn ₹30 for each premium upgrade</p>
              <Button variant="secondary" size="sm">
                Share Now
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading videos...</p>
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
                <p className="text-gray-500">No videos available at the moment.</p>
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
                        src={post.user.avatar} 
                        alt={post.user.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <h3 className="font-semibold">{post.user.name}</h3>
                          {post.user.isVerified && (
                            <span className="ml-1 text-adtip-teal">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {post.sponsored ? "Sponsored" : "2h ago"}
                        </p>
                      </div>
                      <button className="ml-auto text-gray-500">•••</button>
                    </div>
                    
                    {/* Post content */}
                    <div className="relative">
                      {post.content.type === "video" ? (
                        <div className="aspect-video bg-gray-200 flex items-center justify-center">
                          <img 
                            src={post.content.thumbnail} 
                            alt="Video thumbnail" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                <svg className="h-6 w-6 text-adtip-teal" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
                            03:45
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={post.content.image} 
                          alt="Post" 
                          className="w-full aspect-square object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Post description */}
                    <div className="p-4">
                      <p className="text-sm">{post.content.description}</p>
                      
                      {/* Post stats */}
                      <div className="flex items-center mt-4 text-sm text-gray-500">
                        <div className="flex items-center mr-4">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          {post.content.likes}
                        </div>
                        <div className="flex items-center mr-4">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
                          </svg>
                          {post.content.comments}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                          {post.content.shares}
                        </div>
                        <div className="ml-auto text-xs">
                          {post.content.views} views
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Following Tab */}
          <TabsContent value="following">
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold mb-4">Start following creators</h3>
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