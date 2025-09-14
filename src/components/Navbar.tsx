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
  AlertTriangle,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSidebar } from "../contexts/SidebarContext";
import { userAPI } from "../services/api";
import AdTipSidebar from "@/components/ui/AdTipSidebar";
import usePremiumStatus from "../hooks/usePremiumStatus";

const Navbar = () => {
  const { user, updateUserProfile } = useAuth();
  const { toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [showCancelPremiumDialog, setShowCancelPremiumDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [showPremiumRequiredDialog, setShowPremiumRequiredDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Use premium status hook (commented out - using content-premium check instead)
  // const { isPremium, loading: premiumLoading } = usePremiumStatus(user?.id?.toString());
  
  // Content Premium Check Function
  const checkContentPremium = () => {
    // Check if user has content-premium (not user-premium)
    return user?.is_premium === true;
  };
  
  // Get content premium status
  const hasContentPremium = checkContentPremium();

  // Fetch and update content-premium status from API
  const fetchAndUpdatePremiumStatus = async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('UserLoggedIn');
      if (!token) return;

      // Fetch content-premium status using the correct endpoint
      const premiumResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/content-premium/status/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (premiumResponse.data && premiumResponse.data.data) {
        const premiumData = premiumResponse.data.data;
        // Check if subscription is active and not cancelled
        const isPremium = premiumData.is_active === true && premiumData.status !== "cancelled";
        
        // Update user profile with latest content-premium status
        updateUserProfile({
          is_premium: isPremium
        });
      }
    } catch (error) {
      console.error('Error fetching content-premium status:', error);
    }
  };

  // Fetch complete user profile (alternative method)
  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('UserLoggedIn');
      if (!token) return;

      // Fetch user profile using the correct endpoint
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/${user.id}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.status && response.data.data?.user) {
        const userData = response.data.data.user;
        // Update user profile with latest data
        updateUserProfile({
          is_premium: userData.is_premium || false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchSuggestions(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchSuggestions(e.target.value.length > 0);
  };

  const handleSearchInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSearchSuggestions(false), 200);
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

  // Fetch premium status on component mount and user change
  useEffect(() => {
    if (user?.id) {
      fetchAndUpdatePremiumStatus();
    }
  }, [user?.id]);

  // Refresh premium status when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        fetchAndUpdatePremiumStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  // Sync toggle state with content premium status
  useEffect(() => {
    // Always start with toggle off
    setIsToggleOn(false);
    
    // Only set to on if user has content-premium
    if (user && hasContentPremium) {
      setIsToggleOn(true);
    } else {
      setIsToggleOn(false);
    }
  }, [user, hasContentPremium]);

  // Handle error case
  useEffect(() => {
    // The error handling for 401 is now handled by the interceptor in axios.interceptors.response
    // This useEffect is no longer needed for 401 errors.
    // If there are other specific error handling needs, they should be added here.
  }, []);

  // Handle cancel premium
  const handleCancelPremium = async () => {
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('UserLoggedIn');
      if (!token) {
        setMessageType("error");
        setCancelMessage("Authentication required. Please log in again.");
        setShowCancelMessage(true);
        return;
      }

      // Check if user actually has content-premium
      if (!hasContentPremium) {
        setMessageType("info");
        setCancelMessage("You don't have an active content-premium subscription to cancel.");
        setShowCancelMessage(true);
        setShowCancelPremiumDialog(false);
        return;
      }

      // Call API to cancel premium subscription
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/content-premium/cancel`,
        {
          user_id: user?.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status) {
        // Update user profile to remove premium status
        updateUserProfile({ is_premium: false });
        setIsToggleOn(false);
        setShowCancelPremiumDialog(false);
        
        // Show success message
        setMessageType("success");
        setCancelMessage("Premium subscription cancelled successfully! You can now choose from our content creator plans.");
        setShowCancelMessage(true);
        
        // Navigate to content creator plans after a short delay
        setTimeout(() => {
          navigate("/chooseplan", { state: { openCreatorPacks: true } });
        }, 2000);
      } else {
        setMessageType("error");
        setCancelMessage(response.data.message || "Failed to cancel premium subscription. Please try again.");
        setShowCancelMessage(true);
      }
    } catch (error: any) {
      console.error('Error cancelling premium:', error);
      setMessageType("error");
      
      if (error.response?.status === 400) {
        setCancelMessage("Invalid request. Please check your account status.");
      } else if (error.response?.status === 401) {
        setCancelMessage("Authentication failed. Please log in again.");
      } else if (error.response?.status === 404) {
        setCancelMessage("Premium subscription not found. You may not have an active subscription.");
      } else {
        setCancelMessage("An error occurred while cancelling premium. Please try again later.");
      }
      
      setShowCancelMessage(true);
    } finally {
      setIsCancelling(false);
    }
  };

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
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search users or content..."
              className="w-full px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 pr-8 text-sm md:text-base rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal focus:ring-2 focus:ring-adtip-teal/20"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onBlur={handleSearchInputBlur}
              onFocus={() => setShowSearchSuggestions(searchQuery.length > 0)}
            />
            <button type="submit" className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-adtip-teal transition-colors">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            {/* Search Suggestions */}
            {showSearchSuggestions && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div 
                    className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                      setShowSearchSuggestions(false);
                    }}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Search for "{searchQuery}"</span>
                  </div>
          </div>
              </div>
            )}
          </form>
        </div>

      {/* Right: Icons, Toggle, and Profile */}
<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
  {/* Toggle Button */}
  <button
    onClick={() => {
      if (!user) {
        navigate("/login");
      } else if (!hasContentPremium) {
        // Non-content-premium user trying to turn on - show premium required dialog
        setShowPremiumRequiredDialog(true);
      } else if (hasContentPremium) {
        // Content-premium user trying to turn off - show cancel dialog
        setShowCancelPremiumDialog(true);
      } else {
        // This should not happen as non-premium users are handled above
        // But if it does, ensure toggle stays off
        setIsToggleOn(false);
      }
    }}
    className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-1 sm:p-1.5 transition-colors hover:bg-gray-100"
            aria-label="Toggle premium status"
  >
    {(user && hasContentPremium) ? (
      <ToggleRight className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-adtip-teal" />
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

      {/* Cancel Premium Dialog */}
      {showCancelPremiumDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Premium</h3>
                </div>
                <button
                  onClick={() => setShowCancelPremiumDialog(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel your premium subscription? You'll lose access to premium features and content.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> After cancelling, you can choose from our content creator plans to continue creating and monetizing content.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelPremiumDialog(false);
                    navigate("/chooseplan", { state: { openCreatorPacks: true } });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isCancelling}
                >
                  Choose Premium Plans
                </button>
                <button
                  onClick={handleCancelPremium}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Premium'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Premium Message */}
      {showCancelMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    messageType === "success" ? "bg-green-100" : 
                    messageType === "error" ? "bg-red-100" : 
                    "bg-blue-100"
                  }`}>
                    {messageType === "success" ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : messageType === "error" ? (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    ) : (
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className={`text-lg font-semibold ${
                    messageType === "success" ? "text-green-900" : 
                    messageType === "error" ? "text-red-900" : 
                    "text-blue-900"
                  }`}>
                    {messageType === "success" ? "Success!" : 
                     messageType === "error" ? "Error" : 
                     "Information"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCancelMessage(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className={`text-gray-600 ${
                  messageType === "success" ? "text-green-800" : 
                  messageType === "error" ? "text-red-800" : 
                  "text-blue-800"
                }`}>
                  {cancelMessage}
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCancelMessage(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    messageType === "success" ? "bg-green-600 text-white hover:bg-green-700" : 
                    messageType === "error" ? "bg-red-600 text-white hover:bg-red-700" : 
                    "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Required Dialog */}
      {showPremiumRequiredDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Premium Required</h3>
                </div>
                <button
                  onClick={() => setShowPremiumRequiredDialog(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-blue-800 mb-4">
                  This toggle is only available for premium users. Upgrade to premium to access exclusive features and content.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Premium Benefits:</strong> Access to exclusive content, advanced features, and priority support.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumRequiredDialog(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPremiumRequiredDialog(false);
                    navigate("/chooseplan", { state: { openCreatorPacks: true } });
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 rounded-lg transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;