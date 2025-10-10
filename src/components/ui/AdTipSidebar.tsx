import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChannelForm } from "./ChannelForm";
import type { Channel, ChannelFormData } from "./ChannelForm";
import { userAPI } from "../../services/api";
import { apiGetCompanyList } from "../../api";




import {
  Home, Play, Video, Phone, Users, Settings,
  PlusCircle, Gift, MessageSquare, FileText,
  ShoppingCart, BarChart3, Wallet, Store,
  User, Package, Heart, BadgeDollarSign,
  Layout, Crown, Building2
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreatePostDialog from "../CreatePostDialog";
import { useSidebar } from "../../contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "./sidebar-components";
import SubmissionForm from "./SubmissionForm";
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 500) {
      console.error('Server Error:', {
        endpoint: error.config.url,
        message: error.response.data?.message || 'Internal Server Error'
      });
      // Optionally redirect to maintenance page or show user-friendly message
    }
    if (error.response?.status === 401) {
      // Clear invalid auth data
      localStorage.removeItem('UserLoggedIn');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  subtitle?: string;
  external?: boolean;
  onClick?: () => void;
  special?: boolean;
  state?: any;
}

const AdTipSidebar = () => {
  const location = useLocation();
  const { user, updateUser } = useAuth();

  // Keep all your original sidebar mobile props
  const { isCollapsed, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
 

  const [isHovered, setIsHovered] = React.useState(false);

  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  const [showChannelForm, setShowChannelForm] = React.useState(false);
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [showPostTypeMenu, setShowPostTypeMenu] = React.useState(false);
  const [selectedPostType, setSelectedPostType] = React.useState<'create-post' | 'tip-tube' | 'tip-shorts'>('tip-tube');
    const navigate = useNavigate();
   const { isAuthenticated, logout } = useAuth();
   
   // State for seller dashboard
   const [hasCompanies, setHasCompanies] = React.useState<boolean | null>(null);
   const [isCheckingCompanies, setIsCheckingCompanies] = React.useState(false);
   const [showSellerDialog, setShowSellerDialog] = React.useState(false);
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
       localStorage.removeItem("channels");
      // Call AuthContext logout to clear context state
      logout();
      // Redirect to login
      navigate("/login");
    }
  };

  const isActive = (path: string) => location.pathname === path;
const baseNavItems = [
  { to: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
  { to: "/watch", label: "TipTube", icon: <Play className="h-5 w-5" /> },
  { to: "/short", label: "TipShorts", icon: <Video className="h-5 w-5" /> },
  { to: "/livestream", label: "LiveStream", icon: <Video className="h-5 w-5" /> },
  { to: "/tipcall", label: "TipCall", icon: <Phone className="h-5 w-5" /> },
];

// Maintain your state as-is
const [mainNavItems, setMainNavItems] = React.useState(baseNavItems);

// 🟢 Effect 1: Build nav items
React.useEffect(() => {
  function buildNavItems() {
const channels: Channel[] = JSON.parse(localStorage.getItem("channels") || "[]");


    const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;

    let items = [...baseNavItems];

    // ✅ Only add if we have a channel with channelId
    if (channels.length > 0 && channels[0]?.channelId) {
      const channelLinks = channels.map((ch) => ({
        to: '/channel',  
        label: ch.channelName || "My Channel",
        icon: <User className="h-5 w-5" />,
      }));
      items = [...items, ...channelLinks];
    }

    if (isSmallScreen) {
      items.push({
        to: "/profile",
        label: "Profile",
        icon: <UserAvatar user={user} />,
      });
    }

    setMainNavItems(items);
  }

  buildNavItems();

  window.addEventListener("resize", buildNavItems);
  return () => window.removeEventListener("resize", buildNavItems);
}, [user]);


// On new channel creation, update state again with helper function
const handleChannelCreated = (formData: ChannelFormData) => {
  // Ensure the API returns channelId in the response
  if (formData.channelId) {
    updateUser({ channelId: formData.channelId });
    localStorage.setItem("channels", JSON.stringify([formData]));
  }
};















  // Close sidebar on route change in mobile mode
  React.useEffect(() => {
    // Only close if openMobile was already true before navigation
    // Prevent auto-close right after opening
    // Remove or comment out the auto-close logic below:
    // if (isMobile && openMobile) {
    //   setOpenMobile(false);
    // }
  }, [location.pathname, isMobile /*, openMobile, setOpenMobile*/]);

  // Handle wheel events for scrolling
  const handleWheel = React.useCallback((e: WheelEvent) => {
    if (isHovered && sidebarRef.current) {
      e.preventDefault();
      sidebarRef.current.scrollTop += e.deltaY;
    }
  }, [isHovered]);

  React.useEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      if (isHovered) {
        sidebar.addEventListener('wheel', handleWheel, { passive: false });
      }
      return () => {
        sidebar.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isHovered, handleWheel]);

  const [channelData, setChannelData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
React.useEffect(() => {
  const fetchChannel = async () => {
    try {
      if (!user?.id || !user?.accessToken) return;

      const response = await userAPI.getChannel(String(user.id));
      
      if (response.data?.data?.[0]?.channelId) {
        const channel = response.data.data[0];
        setChannelData(channel);
        // Ensure channelId from backend wins over existing user state
        updateUser({ 
          ...user,
          channelId: channel.channelId.toString()
        });
        localStorage.setItem("channels", JSON.stringify([channel]));
      } else {
        console.log('ℹ️ No channel found for user in backend response');
      }
    } catch (error) {
      console.error('Channel fetch error:', error);
      // Clear invalid channel data if 401 occurs
      if (error.response?.status === 401) {
        updateUser({ channelId: null });
        localStorage.removeItem("channels");
      }
    }
  };

  // Always verify latest channel from backend on mount/open
  if (user?.id) {
  fetchChannel();
  }
}, [user?.id, user?.accessToken]); // Add accessToken to dependencies

// Check if user has companies registered
React.useEffect(() => {
  const checkUserCompanies = async () => {
    if (!user?.id) {
      setHasCompanies(null);
      return;
    }

    setIsCheckingCompanies(true);
    try {
      const response = await apiGetCompanyList(user.id.toString());
      
      if (response?.data?.status === 200 && response.data.data?.length > 0) {
        setHasCompanies(true);
      } else {
        setHasCompanies(false);
      }
    } catch (error: any) {
      console.error('Error checking user companies:', error);
      // If 404 or not found, user has no companies
      if (error.response?.status === 404 || 
          error.response?.data?.message?.includes('not found')) {
        setHasCompanies(false);
      } else {
        setHasCompanies(null); // Error state - don't show seller dashboard
      }
    } finally {
      setIsCheckingCompanies(false);
    }
  };

  checkUserCompanies();
}, [user?.id]);

  

const ecommerceItems = [
  { to: "/tip-shop", label: "Tip Shop", icon: <ShoppingCart className="h-5 w-5" /> },
  ...(channelData?.channelId
    ? [
        {
          to: `/analytics`,
          label: "Analysis",
          icon: <BarChart3 className="h-5 w-5" />,
        },
      ]
    : []),
  { to: "/follow", label: "Follow", icon: <Users className="h-5 w-5" /> },
  { to: user ? "/wallet" : "/login", label: "My Wallet", icon: <Wallet className="h-5 w-5" /> },
  // Seller Dashboard - conditionally show based on companies
  ...(hasCompanies !== null 
    ? [
        {
          to: hasCompanies ? "/seller/dashboard" : "#",
          label: "Seller Dashboard",
          icon: <Building2 className="h-5 w-5" />,
          onClick: hasCompanies ? undefined : () => setShowSellerDialog(true),
          special: !hasCompanies
        }
      ]
    : []),
  { to: "/become-seller", label: "Become Advertiser", icon: <Store className="h-5 w-5" />, external: true },
  { to: "/post-ads", label: "Post Advertisements", icon: <BadgeDollarSign className="h-5 w-5" /> },
  { 
    to: "/chooseplan", 
    state: { openCreatorPacks: true },
    label: "Premium Upgrade", 
    icon: <Crown className="h-5 w-5" /> 
  },
  { to: "/seller/ad-orders", label: "My Ad Orders", icon: <Package className="h-5 w-5" /> },
  { to: "/seller/ads-cart", label: "Cart", icon: <ShoppingCart className="h-5 w-5" /> },
  { to: "/marketplace/cart", label: "Marketplace Cart", icon: <ShoppingCart className="h-5 w-5" /> },
  { to: "/marketplace/favorites", label: "Favorites", icon: <Heart className="h-5 w-5" /> },
  ];

  // Settings and Support items
  const supportItems = [
    { to: "/refer", label: "Refer & Earn", icon: <Gift className="h-5 w-5" /> },
    { to: "/contact-us", label: "Contact Us", icon: <MessageSquare className="h-5 w-5" /> },
    { to: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
    { to: "/terms", label: "Terms & Conditions", icon: <FileText className="h-5 w-5" /> },
  ];
const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
// Removed hasSubmitted state as per new logic





  // Main sidebar content
  const sidebarContent = (
    <div>
      {/* Post button */}
       <Dialog
      open={isCreatePostOpen}
      onOpenChange={(open) => {
        setIsCreatePostOpen(open);
        if (!open) {
          setShowChannelForm(false);
          setShowCreatePost(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={cn(
            "mb-4 bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] shadow-md hover:shadow-lg transition-all duration-300",
            isCollapsed && !isMobile
              ? "mx-2 w-[48px] h-[40px] flex items-center justify-center p-0"
              : "w-[calc(100%-32px)] mx-4 px-4 py-2"
          )}
          onClick={() => {
            // Wait for both user and channel data to load
            if (!user || user.channelId === undefined) return;
            
            // Prefer backend-verified channelData
            const hasChannel = !!(channelData?.channelId || user.channelId);
            if (!hasChannel) {
              // User doesn't have a channel, show channel creation
              setShowChannelForm(true);
              setShowCreatePost(false);
              setShowPostTypeMenu(false);
              setIsCreatePostOpen(true);
            } else {
              // User has a channel, show post type menu
              setShowPostTypeMenu(true);
              setShowCreatePost(false);
              setShowChannelForm(false);
              setIsCreatePostOpen(true);
            }
          }}
        >
          {isCollapsed && !isMobile ? (
            <PlusCircle className="h-5 w-5" />
          ) : (
            <>
              <PlusCircle className="h-5 w-5" />
              {user?.channelId ? "Upload Content" : "Create Channel"}
            </>
          )}
        </Button>
      </DialogTrigger>

    {/* Step 1: Upload Content → SubmissionForm */}
{!user?.channelId && showCreatePost && (
<SubmissionForm
  onSuccess={(data) => {
    const channelData: ChannelFormData = {
      channelName: data.name,          // map `name` to `channelName`
      description: data.comment,       // map `comment` to `description`
      // Optionally set coverImage and profileImage later in ChannelForm
    };

    handleChannelCreated(channelData);
    // setHasSubmitted(true); // Removed as per new logic
    setShowCreatePost(false);
    setShowChannelForm(true);
  }}
/>

)}

{/* Step 2: After submission → Create Channel → ChannelForm */}
{/* Channel creation form */}
{!user?.channelId && showChannelForm && (
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    <ChannelForm 
      onSave={(formData) => {
        handleChannelCreated(formData);
        if (user && formData.channelId) {
          updateUser({ channelId: formData.channelId });
        }
      }}
    />
  </DialogContent>
)}

{/* Post Type Menu */}
{user?.channelId && showPostTypeMenu && (
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>What would you like to create?</DialogTitle>
      <DialogDescription>Choose the type of content you want to share.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-3 py-4">
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto py-4"
        onClick={() => {
          setSelectedPostType('create-post');
          setShowPostTypeMenu(false);
          setShowCreatePost(true);
        }}
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold">Create Post</span>
          <span className="text-sm text-muted-foreground">Share thoughts and media</span>
        </div>
      </Button>
      
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto py-4"
        onClick={() => {
          setSelectedPostType('tip-tube');
          setShowPostTypeMenu(false);
          setShowCreatePost(true);
        }}
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold">Upload Content (TipTube)</span>
          <span className="text-sm text-muted-foreground">Upload and monetize videos</span>
        </div>
      </Button>
      
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto py-4"
        onClick={() => {
          setSelectedPostType('tip-shorts');
          setShowPostTypeMenu(false);
          setShowCreatePost(true);
        }}
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold">Create Short (TipShot)</span>
          <span className="text-sm text-muted-foreground">Create engaging short videos</span>
        </div>
      </Button>
    </div>
  </DialogContent>
)}

{/* Content Creation Forms */}
{user?.channelId && showCreatePost && (
  <CreatePostDialog
    open={showCreatePost}
    onOpenChange={(open) => {
      if (!open) {
        setIsCreatePostOpen(false);
        setShowChannelForm(false);
        setShowCreatePost(false);
        setShowPostTypeMenu(false);
      }
    }}
    postType={selectedPostType}
  />
)}

    </Dialog>

      {/* Navigation Groups */}
      <div className="space-y-5"> {/* Increased vertical spacing */}
        {/* Main Nav Group */}
        <SidebarGroup>
          {!(isCollapsed && !isMobile) && (
            <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/70">Menu</div>
          )}
      <SidebarGroupContent>
      {mainNavItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => isMobile && setOpenMobile(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-0 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
            isCollapsed && !isMobile && "justify-center px-0",
            isActive(item.to) && "bg-accent text-foreground font-medium"
          )}
        >
          {React.cloneElement(item.icon, { className: "h-6 w-6" })}
          {(!isCollapsed || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
        </Link>
      ))}
    </SidebarGroupContent>
        </SidebarGroup>

        {/* E-commerce Group */}
        <SidebarGroup>
          {!(isCollapsed && !isMobile) && (
            <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/70">E-commerce</div>
          )}
          <SidebarGroupContent>
            {ecommerceItems.map((item) => {
              // Handle special seller dashboard item with onClick
              if (item.special && item.onClick) {
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      item.onClick();
                      if (isMobile) setOpenMobile(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-0 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-accent w-full text-left",
                      isCollapsed && !isMobile && "justify-center px-0"
                    )}
                  >
                    {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                    {(!isCollapsed || isMobile) && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                );
              }
              
              // Handle items with state property using navigate
              if (item.state) {
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      navigate(item.to, { state: item.state });
                      if (isMobile) setOpenMobile(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-0 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-accent w-full text-left",
                      isCollapsed && !isMobile && "justify-center px-0",
                      isActive(item.to) && "bg-accent text-foreground font-medium"
                    )}
                  >
                    {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                    {(!isCollapsed || isMobile) && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                );
              }
              
              // Regular Link for items without state
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => isMobile && setOpenMobile(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-0 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
                    isCollapsed && !isMobile && "justify-center px-0",
                    isActive(item.to) && "bg-accent text-foreground font-medium"
                  )}
                >
                  {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                  {(!isCollapsed || isMobile) && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support Group */}
    {user && (
  <SidebarGroup>
    {!(isCollapsed && !isMobile) && (
      <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/70">Support</div>
    )}
    <SidebarGroupContent>
      {supportItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => isMobile && setOpenMobile(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-0 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
            isCollapsed && !isMobile && "justify-center px-0",
            isActive(item.to) && "bg-accent text-foreground font-medium"
          )}
        >
          {React.cloneElement(item.icon, { className: "h-6 w-6" })}
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium">{item.label}</span>
          )}
        </Link>
      ))}

      {/* Logout button */}
      <button
        onClick={() => setShowLogoutDialog(true)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-0 py-3 w-full text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
          isCollapsed && !isMobile && "justify-center px-0"
        )}
      >
        <LogOut className="h-6 w-6" />
        {(!isCollapsed || isMobile) && (
          <span className="text-sm font-medium">Logout</span>
        )}
      </button>
    </SidebarGroupContent>
  </SidebarGroup>
)}


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

        {/* Seller Dashboard Dialog for users without companies */}
        <Dialog open={showSellerDialog} onOpenChange={setShowSellerDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Seller Dashboard
              </DialogTitle>
              <DialogDescription>
                Access your business management tools and analytics
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Store className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">No Companies Registered</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to register at least one company to access the seller dashboard and start advertising your business.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => setShowSellerDialog(false)}
              >
                Maybe Later
              </Button>
              <Button
                className="sm:flex-1 bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085]"
                onClick={() => {
                  setShowSellerDialog(false);
                  navigate('/seller/register');
                  if (isMobile) setOpenMobile(false);
                }}
              >
                Become Advertiser
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      
    </div>
  );

  // React.useEffect(() => {
  //   console.log('Current user from localStorage:', 
  //     JSON.parse(localStorage.getItem("user") || "{}"));
  // }, [user?.channelId]);

  return (
    <>
      {/* Mobile backdrop - do not render aside in overlay, just sidebarContent */}
      {isMobile && openMobile ? (
        <div className="h-full overflow-y-auto bg-background/95 dark:bg-gray-900/95 backdrop-blur-xl">{sidebarContent}</div>
      ) : (
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] flex-col overflow-y-auto bg-background/80 dark:bg-gray-900/80 backdrop-blur-xl py-4 transition-all duration-500 ease-out z-50 shadow-lg",
            isMobile ? (
              openMobile ? "translate-x-0 w-64 px-0" : "-translate-x-full w-64 px-0"
            ) : (
              isCollapsed ? "w-16 px-0" : "w-64 px-0"
            )
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <style>{`
            .adtip-sidebar::-webkit-scrollbar { display: none !important; }
          `}</style>
          <div className="adtip-sidebar h-full">
            {sidebarContent}
          </div>
        </aside>
      )}
    </>
  );
};

export default AdTipSidebar;

/* Add this to your global CSS if not already present:
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
*/ 