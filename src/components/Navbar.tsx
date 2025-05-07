
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { 
  Home, 
  Video, 
  User, 
  Search, 
  Wallet, 
  Plus,
  Bell,
  MessageSquare,
  PhoneCall
} from "lucide-react";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <>
      {/* Desktop Navbar - Made sticky */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Link to="/home" className="flex items-center">
            <img src="logo.png" alt="AdTip Logo" className="h-8 w-8 mr-2" />
            <span className="text-2xl font-bold text-adtip-teal">AdTip</span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users or content..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/home" 
            className={`flex flex-col items-center ${isActive("/home") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Home className="h-6 w-6" />
          </Link>
          <Link 
            to="/tiptube" 
            className={`flex flex-col items-center ${isActive("/tiptube") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Video className="h-6 w-6" />
          </Link>
          <Link 
            to="/tipcall" 
            className={`flex flex-col items-center ${isActive("/tipcall") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <PhoneCall className="h-6 w-6" />
          </Link>
          <Link
            to="/create-post"
            className="flex items-center justify-center h-10 w-10 rounded-full teal-gradient text-white"
          >
            <Plus className="h-6 w-6" />
          </Link>
          <Link 
            to="/wallet" 
            className={`flex items-center ${isActive("/wallet") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Wallet className="h-6 w-6 mr-1" />
            <span className="font-medium">₹{user?.wallet || '0'}</span>
          </Link>
          <Link 
            to="/notifications" 
            className="text-gray-500"
          >
            <Bell className="h-6 w-6" />
          </Link>
          <Link to="/profile" className="flex items-center">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </Link>
        </div>
      </nav>
      
      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-gray-200 z-20">
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
      </nav>
      
      {/* Mobile Top Search Bar - Make sticky below desktop navbar */}
      <div className="md:hidden sticky top-0 z-20 bg-white p-4 shadow-sm">
        <div className="flex items-center">
          <Link to="/home" className="flex items-center mr-3">
            <img src="logo.png" alt="AdTip Logo" className="h-6 w-6 mr-1" />
            <span className="text-lg font-bold text-adtip-teal">AdTip</span>
          </Link>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal text-sm"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <Link to="/wallet" className="ml-3 flex items-center text-gray-700">
            <Wallet className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
