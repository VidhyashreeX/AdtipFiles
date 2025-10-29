import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, LogOut, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileStats from "../components/ProfileStats";
import ChannelAnalytics from "../components/ChannelAnalytics";
import axios from "axios";
import { userAPI, authAPI, contentAPI } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthModal } from "../contexts/AuthModalContext";
import {
  useCurrentUser,
  useUserChannel,
  useUserAnalytics,
  useUserVideos,
  useUserShorts,
  useUserPosts
} from "../hooks/api";

interface UserChannel {
  id: number;
  name: string;
  subscribers: number;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  // Add other channel fields as needed
}

const Profile = () => {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // React Query hooks for data fetching
  const { data: currentUser } = useCurrentUser();
  const { data: userChannel } = useUserChannel(user?.id || 0, !!user?.id);
  const { data: userAnalytics } = useUserAnalytics(userChannel?.id || userChannel?.channelId || 0, !!userChannel?.id || !!userChannel?.channelId);
  const { data: userVideos = [] } = useUserVideos(user?.id || 0, !!user?.id);
  const { data: userShorts = [] } = useUserShorts(user?.id || 0, !!user?.id);
  const { data: userPostsData } = useUserPosts(user?.id || 0, { limit: 100 });

  // Transform posts data from React Query
  const userPosts = userPostsData?.pages?.flatMap(page => page.data || []) || [];

  // Combine all content and sort by creation date (newest first) like mobile app
  const allContent = React.useMemo(() => {
    const posts = userPosts.map((post: any) => ({
      id: post.id,
      media_url: post.media_url,
      media_type: post.media_type || 'image',
      content: post.content,
      likeCount: post.likeCount || post.like_count || 0,
      commentCount: post.commentCount || post.comment_count || 0,
      created_at: post.created_at,
      is_liked: post.is_liked,
      user_id: post.user_id,
      is_premium: post.is_premium,
      contentType: 'post'
    }));

    const videos = userVideos.map((video: any) => ({
      ...video,
      contentType: 'video',
      media_type: 'video',
      media_url: video.video_link || video.media_url
    }));

    const shorts = userShorts.map((short: any) => ({
      ...short,
      contentType: 'short',
      media_type: 'video',
      media_url: short.video_link || short.media_url
    }));

    return [...posts, ...videos, ...shorts].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Newest first
    });
  }, [userPosts, userVideos, userShorts]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("UserLoggedIn");

    if (!isAuthenticated || !user?.id || !token) {
      console.log("Auth check failed:", { isAuthenticated, userId: user?.id, token });
      openLoginModal();
      return;
    }
  }, [isAuthenticated, user, navigate]);


   const handleLogout = async () => {
    try {
      if (user?.id) {
        // Call logout API, but don't block on it
        await authAPI.logout(String(user.id)).catch(() => {}); // Ignore API errors
      }
    } catch (error) {
      // Ignore API errors, always perform local logout
    } finally {
      // Always clear all localStorage keys related to auth
      localStorage.removeItem("user");
      localStorage.removeItem("UserLoggedIn");
      localStorage.removeItem("UserId");
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("gender");
      localStorage.removeItem("profession");
      localStorage.removeItem("maritalStatus");
      localStorage.removeItem("age");
       localStorage.removeItem("channels");
      // Call AuthContext logout to clear context state
      logout();
      // Redirect to login
      openLoginModal();
    }
  };

  // If not authenticated, return null to avoid rendering
  if (!isAuthenticated) {
    return null;
  }

  const isNewUser = !user?.name;

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold ml-4 text-foreground">Profile</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-6 w-6 text-foreground" />
          </button>
          <button onClick={() => setShowLogoutDialog(true)}>
            <LogOut className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="p-6">
        <div className="flex items-center">
                     <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
             {user?.profile_image ? (
               <img
                 src={user.profile_image}
                 alt={user.name || "User"}
                 className="w-full h-full object-cover"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-2xl font-bold">
                 {user?.name ? user.name[0].toUpperCase() : "U"}
               </div>
             )}
           </div>

          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold text-foreground">{user?.name || "User"}</h2>
                         <p className="text-muted-foreground">@{user?.name || "user"}</p>
            <p className="text-sm mt-1 text-muted-foreground">{user?.bio || "No bio yet"}</p>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <Button
            onClick={() => navigate("/edit-profile")}
            className="flex-1 teal-button"
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            className="border-adtip-teal text-adtip-teal"
          >
            Share Profile
          </Button>
        </div>

        {/* Profile Stats */}
                 <div className="mt-6">
           <ProfileStats
             followers={userChannel?.followers_count || userChannel?.subscribers || 0}
             following={userChannel?.following_count || 0}
             posts={allContent.length}
             tipTubeVideos={userVideos.length}
             userChannel={userChannel}
             totalVideos={userVideos.length}
             totalShorts={userShorts.length}
             isNewUser={isNewUser}
           />
         </div>

                 {/* Tabs */}
         <div className="mt-6">
           <Tabs defaultValue="videos">
             <TabsList className="grid grid-cols-3 w-full">
               <TabsTrigger value="videos">Posts</TabsTrigger>
               <TabsTrigger value="stories">Stories</TabsTrigger>
               <TabsTrigger value="saved">Saved</TabsTrigger>
             </TabsList>

                         <TabsContent value="videos">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Your Videos</h3>
               </div>
               <div className="grid grid-cols-3 gap-1 mt-4">
                 {userVideos.length === 0 && userShorts.length === 0 ? (
                   <div className="col-span-3 text-center py-10 text-gray-400">
                     No videos yet. Upload your first video to get started!
                   </div>
                 ) : (
                   <>
                     {/* Display TipTube Videos */}
                     {userVideos.map((video: any, index: number) => (
                       <div
                         key={`video-${index}`}
                         className="aspect-video bg-gray-200 rounded relative overflow-hidden cursor-pointer group"
                         onClick={() => {
                           console.log('Video clicked:', video);
                           // Play/pause the video
                           const videoElement = document.querySelector(`video[src="${video.video_link}"]`) as HTMLVideoElement;
                           if (videoElement) {
                             if (videoElement.paused) {
                               videoElement.play();
                             } else {
                               videoElement.pause();
                             }
                           }
                         }}
                       >
                         {video.video_Thumbnail && video.video_link ? (
                           <div className="w-full h-full relative">
                             <video
                               src={video.video_link}
                               controls
                               className="w-full h-full object-cover"
                               preload="metadata"
                             />
                             
                             {/* Play Overlay */}
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                 <Play className="w-6 h-6 text-white ml-1" />
                               </div>
                             </div>
                           </div>
                         ) : video.video_Thumbnail ? (
                           <img
                             src={video.video_Thumbnail}
                             alt={video.name || 'Video thumbnail'}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               // Fallback to placeholder if image fails to load
                               e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjBGMDBGMCIvPgo8dGV4dCB4PSIxNjAiIHk9IjEyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K';
                             }}
                           />
                         ) : (
                           <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                             <span className="text-gray-500 text-sm">No Thumbnail</span>
                           </div>
                         )}
                         <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                           {video.name || 'Untitled Video'}
                         </div>
                       </div>
                     ))}
                     
                     {/* Display TipShorts */}
                     {userShorts.map((short: any, index: number) => (
                       <div
                         key={`short-${index}`}
                         className="aspect-video bg-gray-200 rounded relative overflow-hidden cursor-pointer group"
                         onClick={() => {
                           console.log('Short clicked:', short);
                           // Play/pause the short
                           const videoElement = document.querySelector(`video[src="${short.video_link}"]`) as HTMLVideoElement;
                           if (videoElement) {
                             if (videoElement.paused) {
                               videoElement.play();
                             } else {
                               videoElement.pause();
                             }
                           }
                         }}
                       >
                         {short.video_Thumbnail && short.video_link ? (
                           <div className="w-full h-full relative">
                             <video
                               src={short.video_link}
                               controls
                               className="w-full h-full object-cover"
                               preload="metadata"
                             />
                             
                             {/* Play Overlay */}
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                 <Play className="w-6 h-6 text-white ml-1" />
                               </div>
                             </div>
                             
                             {/* Short Badge */}
                             <div className="absolute top-2 left-2 bg-adtip-teal text-white px-2 py-1 rounded text-xs font-medium">
                               Short
                             </div>
                           </div>
                         ) : short.video_Thumbnail ? (
                           <img
                             src={short.video_Thumbnail}
                             alt={short.name || 'Short thumbnail'}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               // Fallback to placeholder if image fails to load
                               e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjBGMDBGMCIvPgo8dGV4dCB4PSIxNjAiIHk9IjEyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IiIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNob3J0IFRodW1ibmFpbDwvdGV4dD4KPC9zdmc+Cg==';
                             }}
                           />
                         ) : (
                           <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                             <span className="text-gray-500 text-sm">No Thumbnail</span>
                           </div>
                         )}
                         <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                           {short.name || 'Untitled Short'}
                         </div>
                       </div>
                     ))}
                   </>
                 )}
               </div>
             </TabsContent>

             <TabsContent value="analytics">
               <div className="mb-4">
                 <h3 className="text-lg font-semibold">Channel Analytics</h3>
                 <p className="text-sm text-gray-600">Track your channel performance and earnings</p>
               </div>
               <ChannelAnalytics
                 analytics={userAnalytics}
                 isLoading={false}
                 demoMode={true}
                 onWithdraw={(amount) => {
                   console.log('Withdrawing amount:', amount);
                   // TODO: Implement withdrawal logic
                   toast.success(`Withdrawal request for ₹${amount.toLocaleString()} submitted successfully!`);
                 }}
               />
             </TabsContent>

            <TabsContent value="stories">
              <div className="text-center py-10 text-gray-400">
                No stories yet
              </div>
            </TabsContent>

            <TabsContent value="saved">
              <div className="text-center py-10 text-gray-400">
                No saved content
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/how-to-earn-creator");
                setShowSettingsDialog(false);
              }}
            >
              How to earn as content creator
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/how-to-earn-user");
                setShowSettingsDialog(false);
              }}
            >
              How to earn as user
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/refer");
                setShowSettingsDialog(false);
              }}
            >
              Refer and earn
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/ads-tracker");
                setShowSettingsDialog(false);
              }}
            >
              Ads tracker
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/premium");
                setShowSettingsDialog(false);
              }}
            >
                             Premium status: {user?.is_premium ? "Premium" : "Free"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/wallet");
                setShowSettingsDialog(false);
              }}
            >
              Wallet: ₹{user?.wallet || 0}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                navigate("/settings");
                setShowSettingsDialog(false);
              }}
            >
              Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out of AdTip</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You'll need to enter your phone
              number and OTP to log back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="sm:flex-1"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
