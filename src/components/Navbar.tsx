import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  User,
  Search,
  Wallet,
  Bell,
  Home,
  Video,
  Plus,
  PhoneCall,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const Navbar = () => {
  const { user, updateUserProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Define the type for the API response
  interface BalanceResponse {
    status: number;
    message: string;
    availableBalance: string;
  }

  // Fetch wallet balance using react-query
  const { data: balanceData, isLoading, isSuccess, error } = useQuery<BalanceResponse, Error>({
    queryKey: ["walletBalance", user?.id],
    queryFn: async () => {
      if (!user?.id || !user?.accessToken) {
        throw new Error("User ID or access token missing");
      }
      const response = await axios.get(`http://3.6.15.198:7082/api/getfunds/${user.id}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      console.log("Wallet balance response:", response.data);
      return response.data;
    },
    enabled: !!user?.id && !!user?.accessToken, // Only run if user.id and accessToken exist
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update user profile when balance is successfully fetched
  useEffect(() => {
    if (isSuccess && balanceData) {
      const balance = parseFloat(balanceData.availableBalance) || 0;
      updateUserProfile({ wallet: balance });
    }
  }, [isSuccess, balanceData, updateUserProfile]);

  // Handle error case
  useEffect(() => {
    if (error) {
      console.error("Failed to fetch wallet balance:", error.message);
      updateUserProfile({ wallet: 0 }); // Fallback to 0 on error
    }
  }, [error, updateUserProfile]);

  return (
    <nav className="sticky top-0 z-30 w-full bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-3"> {/* Increased gap from 2 to 3 */}
          <Link to="/home" className="flex items-center">
            <img src="/logo.png" alt="AdTip Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-adtip-teal ml-2">AdTip</span> {/* Added ml-2 for more space */}
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-3xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users or content..."
              className="w-full px-5 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
        </div>

        {/* Right: Icons, Toggle, and Profile */}
        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            className="text-gray-500 hover:text-adtip-teal transition-colors"
          >
            <Bell className="h-6 w-6" />
          </Link>
          {/* Toggle Button */}
          <button
            onClick={() => setIsToggleOn(!isToggleOn)}
            className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1.5 transition-colors hover:bg-gray-100"
            aria-label="Toggle notifications"
          >
            {isToggleOn ? (
              <ToggleRight className="h-10 w-10 text-green-500" />
            ) : (
              <ToggleLeft className="h-10 w-10 text-gray-400" />
            )}
          </button>
          <Link
            to="/wallet"
            className="flex items-center text-gray-700 hover:text-adtip-teal transition-colors"
          >
            <Wallet className="h-6 w-6 mr-1" />
            <span className="font-medium">
              {isLoading ? "..." : "Wallet"}
            </span>
          </Link>
          <Link to="/profile" className="flex items-center ml-2">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt="Profile"
                className="h-9 w-9 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-gray-200 z-20">
        <div className="flex justify-around items-center px-2 py-3">
          <Link
            to="/home"
            className={`flex flex-col items-center ${isActive("/home") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            to="/tiptube"
            className={`flex flex-col items-center ${isActive("/tiptube") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Video className="h-6 w-6" />
            <span className="text-xs mt-1">TipTube</span>
          </Link>
          <Link
            to="/create-post"
            className="flex flex-col items-center justify-center"
          >
            <div className="h-12 w-12 rounded-full teal-gradient flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </Link>
          <Link
            to="/tipcall"
            className={`flex flex-col items-center ${isActive("/tipcall") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <PhoneCall className="h-6 w-6" />
            <span className="text-xs mt-1">TipCall</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center ${isActive("/profile") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;