import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChannelForm } from "./ChannelForm";
import type { ChannelFormData } from "./ChannelForm";




import {
  Home, Play, Video, Phone, Users, Settings,
  PlusCircle, Gift, MessageSquare, FileText,
  ShoppingCart, BarChart3, Wallet, Store,
  User, Package, Heart, BadgeDollarSign,
  Layout, Crown
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


interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  subtitle?: string;
  external?: boolean;
}

const AdTipSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Keep all your original sidebar mobile props
  const { isCollapsed, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
 

  const [isHovered, setIsHovered] = React.useState(false);

  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  const [showChannelForm, setShowChannelForm] = React.useState(false);
  const [showCreatePost, setShowCreatePost] = React.useState(false);
    const navigate = useNavigate();
   const { isAuthenticated, logout } = useAuth();
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

  const isActive = (path: string) => location.pathname === path;
const baseNavItems = [
  { to: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
  { to: "/watch", label: "TipTube", icon: <Play className="h-5 w-5" /> },
  { to: "/short", label: "TipShorts", icon: <Video className="h-5 w-5" /> },
  { to: "/tipcall", label: "TipCall", icon: <Phone className="h-5 w-5" /> },
];

// Maintain your state as-is
const [mainNavItems, setMainNavItems] = React.useState(baseNavItems);


React.useEffect(() => {
  function buildNavItems() {
    const channels: ChannelFormData[] = JSON.parse(localStorage.getItem("channels") || "[]");

    const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;

    // Start with base items
    let items = [...baseNavItems];

    // Add channels if any
    if (channels.length > 0) {
      const channelLinks = channels.map((ch) => ({
 to: `/channel/${encodeURIComponent(ch.channelName)}`,
        label: "My Channel",
        icon: <User className="h-5 w-5" />,
      }));
      items = [...items, ...channelLinks];
    }

    // Add profile if small screen
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
const handleChannelCreated = (data: ChannelFormData) => {
  const savedChannels = JSON.parse(localStorage.getItem("channels") || "[]");

  if (!savedChannels.some((ch: ChannelFormData) => ch.channelName === data.channelName)) {
    savedChannels.push(data);
    localStorage.setItem("channels", JSON.stringify(savedChannels));
  }

  // 🔥 Rebuild sidebar items immediately
  setMainNavItems((prev) => {
    const baseItems = [...baseNavItems];
    const channelLinks = savedChannels.map((ch) => ({
      to: `/channel/${encodeURIComponent(ch.channelName)}`,
      label: "My Channel",
      icon: <User className="h-5 w-5" />,
    }));

    const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;
    if (isSmallScreen) {
      return [
        ...baseItems,
        ...channelLinks,
        {
          to: "/profile",
          label: "Profile",
          icon: <UserAvatar user={user} />,
        },
      ];
    }

    return [...baseItems, ...channelLinks];
  });
  // ✅ mark that channel creation is done
  setHasSubmitted(false);
  localStorage.setItem("hasCreatedChannel", "false");
  setShowChannelForm(false);

  

  navigate(`/channel/${encodeURIComponent(data.channelName)}`);
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
  

  const ecommerceItems = [
    { to: "/tip-shop", label: "Tip Shop", icon: <ShoppingCart className="h-5 w-5" /> },
    { to: "/analysis", label: "Analysis", icon: <BarChart3 className="h-5 w-5" /> },
    { to: "/follow", label: "Follow", icon: <Users className="h-5 w-5" /> },
    { to: user ? "/wallet" : "/login", label: "My Wallet", icon: <Wallet className="h-5 w-5" /> },
    { to: "/become-seller-full", label: "Become Seller", icon: <Store className="h-5 w-5" />, external: true },
    { to: "/post-ads", label: "Post Advertisers", icon: <BadgeDollarSign className="h-5 w-5" /> },
    { to: "/premium", label: "Premium Upgrade", icon: <Crown className="h-5 w-5" /> },
    { to: "/marketplace/my-orders", label: "My Orders", icon: <Package className="h-5 w-5" /> },
    { to: "/marketplace/cart", label: "Cart", icon: <ShoppingCart className="h-5 w-5" /> },
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
const [hasSubmitted, setHasSubmitted] = React.useState(() => {
  return localStorage.getItem("hasCreatedChannel") === "true";
});





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
            "mb-4 bg-adtip-teal hover:bg-adtip-teal/90",
            isCollapsed && !isMobile
              ? "mx-2 w-[48px] h-[40px] flex items-center justify-center p-0"
              : "w-[calc(100%-32px)] mx-4 px-4 py-2"
          )}
          onClick={() => {
            if (hasSubmitted) {
              // Show channel creation form
              setShowCreatePost(false);
              setShowChannelForm(true);
              setIsCreatePostOpen(true);
            } else {
              // Show upload video form
              setShowCreatePost(true);
              setShowChannelForm(false);
              setIsCreatePostOpen(true);
            }
          }}
        >
          {isCollapsed && !isMobile ? (
            <PlusCircle className="h-5 w-5" />
          ) : (
            <>
              <PlusCircle className="h-5 w-5 " />
              {hasSubmitted ? "Create Channel" : "Upload Video"}
            </>
          )}
        </Button>
      </DialogTrigger>

    {/* Step 1: Upload Video → SubmissionForm */}
{!hasSubmitted && showCreatePost && (
<SubmissionForm
  onSuccess={(data) => {
    const channelData: ChannelFormData = {
      channelName: data.name,          // map `name` to `channelName`
      description: data.comment,       // map `comment` to `description`
      // Optionally set coverImage and profileImage later in ChannelForm
    };

    handleChannelCreated(channelData);
    setHasSubmitted(true);
    setShowCreatePost(false);
    setShowChannelForm(true);
  }}
/>

)}

{/* Step 2: After submission → Create Channel → ChannelForm */}
{showChannelForm && (
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
<ChannelForm onSave={(formData) => handleChannelCreated(formData)} />






  </DialogContent>
)}

{/* Optional: Keep CreatePostDialog for other flows */}
{showCreatePost && !hasSubmitted && (
  <CreatePostDialog
    onClose={() => {
      setIsCreatePostOpen(false);
      setShowChannelForm(false);
      setShowCreatePost(false);
    }}
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
            "flex items-center gap-3 rounded-lg px-0 py-3 text-gray-500 transition-all hover:text-gray-900",
            isCollapsed && !isMobile && "justify-center px-0",
            isActive(item.to) && "bg-gray-100 text-gray-900"
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
            {ecommerceItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => isMobile && setOpenMobile(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-0 py-3 text-gray-500 transition-all hover:text-gray-900",
                  isCollapsed && !isMobile && "justify-center px-0",
                  isActive(item.to) && "bg-gray-100 text-gray-900"
                )}
              >
                {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ))}
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
            "flex items-center gap-3 rounded-lg px-0 py-3 text-gray-500 transition-all hover:text-gray-900",
            isCollapsed && !isMobile && "justify-center px-0",
            isActive(item.to) && "bg-gray-100 text-gray-900"
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
          "flex items-center gap-3 rounded-lg px-0 py-3 w-full text-gray-500 transition-all hover:text-gray-900",
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

      </div>
      
    </div>
  );

  return (
    <>
      {/* Mobile backdrop - do not render aside in overlay, just sidebarContent */}
      {isMobile && openMobile ? (
        <div className="h-full overflow-y-auto">{sidebarContent}</div>
      ) : (
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed left-0 top-14 h-[calc(100vh-3.5rem)] flex-col overflow-y-auto border-r bg-white py-4 transition-all duration-300 z-50",
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