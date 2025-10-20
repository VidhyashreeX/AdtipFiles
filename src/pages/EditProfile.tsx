
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Wallet, Gift, ChevronRight, BarChart, Award, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthModal } from "../contexts/AuthModalContext";

const EditProfile = () => {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [storyHighlight, setStoryHighlight] = useState("");
  
  if (!isAuthenticated) {
    openLoginModal();
    return null;
  }

  const handleSave = () => {
    updateUserProfile({
      name,
      username,
      bio,
    });
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
    
    navigate("/profile");
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Edit Profile</h1>
        </div>
        <Button onClick={handleSave} className="teal-button">Save</Button>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-2">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-3xl font-bold">
                {name ? name[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
          <button className="text-adtip-teal text-sm flex items-center">
            <Upload className="h-4 w-4 mr-1" />
            Change Photo
          </button>
        </div>
        
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="storyHighlight" className="block text-sm font-medium text-gray-700 mb-1">
              Add Story Highlight
            </label>
            <div className="flex">
              <Input
                id="storyHighlight"
                value={storyHighlight}
                onChange={(e) => setStoryHighlight(e.target.value)}
                placeholder="Highlight name"
                className="flex-1 mr-2"
              />
              <Button 
                variant="outline" 
                className="border-adtip-teal text-adtip-teal"
                onClick={() => {
                  if (storyHighlight) {
                    toast({
                      title: "Story highlight added",
                      description: `${storyHighlight} has been added to your highlights`,
                    });
                    setStoryHighlight("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        {/* Option Links */}
        <div className="mt-6 space-y-1">
          <h3 className="text-lg font-medium mb-3">Account Options</h3>
          
          {/* How to earn as content creator */}
          <button 
            onClick={() => navigate("/how-to-earn-creator")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Upload className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">How to earn as content creator</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          
          {/* How to earn as user */}
          <button 
            onClick={() => navigate("/how-to-earn-user")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Award className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">How to earn as user</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          
          {/* Refer and earn */}
          <button 
            onClick={() => navigate("/refer")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Gift className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">Refer and earn</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          
          {/* Ads tracker */}
          <button 
            onClick={() => navigate("/ads-tracker")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">Ads tracker</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          
          {/* Premium status */}
          <button 
            onClick={() => navigate("/premium")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Award className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">Premium status</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full mr-2">
                {user?.isPremium ? "Premium" : "Free"}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          
          {/* Wallet */}
          <button 
            onClick={() => navigate("/wallet")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">Wallet</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium mr-2">
                ₹{user?.wallet || 0}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          
          {/* Settings */}
          <button 
            onClick={() => navigate("/settings")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-adtip-teal" />
              <span className="ml-3">Settings</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
