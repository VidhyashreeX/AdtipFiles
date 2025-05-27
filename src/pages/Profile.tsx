import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProfileStats from "../components/ProfileStats";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface UserChannel {
  id: number;
  name: string;
  subscribers: number;
  // Add other channel fields as needed
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [userChannel, setUserChannel] = useState<UserChannel | null>(null);
  const [userStats, setUserStats] = useState(null);

  // Check authentication and fetch user data
  useEffect(() => {
    const token = localStorage.getItem("UserLoggedIn");

    if (!isAuthenticated || !user?.id || !token) {
      console.log("Auth check failed:", { isAuthenticated, userId: user?.id, token });
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch user channel data
        const channelResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/getchannelbyuserid/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (channelResponse.data.status) {
          setUserChannel(channelResponse.data.data);

          // Fetch user analytics if channel exists
          if (channelResponse.data.data?.id) {
            const analyticsResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/analytics/${channelResponse.data.data.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (analyticsResponse.data.status) {
              setUserStats(analyticsResponse.data.data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // If we get a 401 unauthorized error, redirect to login
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      if (user?.id) {
        // Call logout API, but don't block on it
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/logout`,
          { id: user.id },
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        ).catch(() => {}); // Ignore API errors
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
      // Call AuthContext logout to clear context state
      logout();
      // Redirect to login
      navigate("/login");
    }
  };

  // If not authenticated, return null to avoid rendering
  if (!isAuthenticated) {
    return null;
  }

  const isNewUser = !user?.name || !user?.username;

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Profile</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-6 w-6" />
          </button>
          <button onClick={() => setShowLogoutDialog(true)}>
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-2xl font-bold">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
          </div>

          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
            <p className="text-gray-500">@{user?.username || "username"}</p>
            <p className="text-sm mt-1">{user?.bio || "No bio yet"}</p>
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
            followers={isNewUser ? 0 : 512}
            following={isNewUser ? 0 : 237}
            posts={isNewUser ? 0 : 48}
            tipTubeVideos={isNewUser ? 0 : 12}
            isNewUser={isNewUser}
          />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="videos">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <div className="grid grid-cols-3 gap-1 mt-4">
                {isNewUser ? (
                  <div className="col-span-3 text-center py-10 text-gray-400">
                    No videos yet
                  </div>
                ) : (
                  [1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="aspect-video bg-gray-200 rounded"
                    ></div>
                  ))
                )}
              </div>
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
              Premium status: {user?.isPremium ? "Premium" : "Free"}
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