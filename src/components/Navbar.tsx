import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import UserAvatar from "../components/ui/UserAvatar"; // Adjust path as needed

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
  Menu,
  CirclePlay,
  PhoneIcon,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSidebar } from "../contexts/SidebarContext";
import { userAPI } from "../services/api";
import AdTipSidebar from "@/components/ui/AdTipSidebar";

const Navbar = () => {
  const { user, updateUserProfile } = useAuth();
  const { toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggleOn, setIsToggleOn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
  const { 
    data: balanceData, 
    isLoading, 
    isSuccess, 
    error // Add this to the destructured values
  } = useQuery<BalanceResponse, Error>({ // Explicitly type the error as Error
    queryKey: ["walletBalance", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User ID missing");
      }
      // Use the centralized API service instead of direct axios call
      const response = await userAPI.getWalletBalance(String(user.id));
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update user profile when balance is successfully fetched
  useEffect(() => {
    if (isSuccess && balanceData) {
      const balance = parseFloat(balanceData.availableBalance) || 0;
      // Only update if balance actually changed
      if (user?.wallet !== balance) {
        updateUserProfile({ wallet: balance }); // Use updateUser instead of updateUserProfile
      }
    }
  }, [isSuccess, balanceData, updateUserProfile, user?.wallet]); // Add user.wallet to dependencies

  // Handle error case
  useEffect(() => {
    // The error handling for 401 is now handled by the interceptor in axios.interceptors.response
    // This useEffect is no longer needed for 401 errors.
    // If there are other specific error handling needs, they should be added here.
  }, []);

  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200">
      {/* Mobile Sidebar Overlay */}
      <div className="md:hidden">
        {openMobile && (
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={() => setOpenMobile(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
              <div className="h-full overflow-y-auto">
                <AdTipSidebar />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 md:py-3">
        {/* Left: Hamburger and Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleSidebar}
            className="p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
          <Link to="/home" className="flex items-center">
            <img src="/logo.png" alt="AdTip Logo" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            <span className="text-base sm:text-lg md:text-xl font-bold text-adtip-teal ml-1.5 sm:ml-2">AdTip</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-3xl mx-2 sm:mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users or content..."
              className="w-full px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 pr-8 text-sm md:text-base rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

      {/* Right: Icons, Toggle, and Profile */}
<div className="flex items-center gap-2 sm:gap-3 md:gap-4">

  {/* Toggle Button */}
  <button
    onClick={() => {
      if (!user) {
        navigate("/login");
      } else if (!user.is_premium) {
        navigate("/pricingoffers");
      } else {
        setIsToggleOn(!isToggleOn);
      }
    }}
    className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1 sm:p-1.5 transition-colors hover:bg-gray-100"
    aria-label="Toggle notifications"
  >
    {isToggleOn ? (
      <ToggleRight className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-green-500" />
    ) : (
      <ToggleLeft className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-gray-400" />
    )}
  </button>

  <Link
    to={user ? "/wallet" : "/login"}
    className="flex items-center text-gray-700 hover:text-adtip-teal transition-colors bg-gray-50 border border-gray-200 rounded-full px-3 py-1 mr-1"
    style={{ minWidth: 70 }}
  >
    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
    <span className="text-sm sm:text-base font-medium tabular-nums">
      {isLoading
        ? "..."
        : balanceData && typeof balanceData.availableBalance === "string"
        ? `₹${parseFloat(balanceData.availableBalance).toFixed(2)}`
        : "₹0.00"}
    </span>
  </Link>

  <Link to="/profile" className="hidden md:flex items-center ml-1 sm:ml-2">
    <UserAvatar user={user} />
  </Link>
</div>

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-gray-200 z-20">
        <div className="flex justify-around items-center px-2 py-2 sm:py-3">
          <Link
            to="/home"
            className={`flex flex-col items-center ${isActive("/home") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Home className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs mt-1">Home</span>
          </Link>
          <Link
           to="/watch"
            className={`flex flex-col items-center ${isActive("/tiptube") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Video className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs mt-1">TipTube</span>
          </Link>
          <Link
            to="/create-post"
            className="flex flex-col items-center justify-center"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full teal-gradient flex items-center justify-center">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </Link>
          <Link
            to="/short"
            className={`flex flex-col items-center ${isActive("/tipshort") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <CirclePlay className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs mt-1">TipShort</span>
          </Link>
          <Link
            to="/tipcall"
            className={`flex flex-col items-center ${isActive("/tipcall") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs mt-1">TipCall</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;