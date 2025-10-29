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
  Layout, Crown, Building2, Radio, Newspaper
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
} from "./sidebar";
import SubmissionForm from "./SubmissionForm";
import { useAuthModal } from "../../contexts/AuthModalContext";
import { triggerLoginModal } from "../../utils/authRedirect";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('UserLoggedIn');
      localStorage.removeItem('user');
      triggerLoginModal();
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
  const { isCollapsed, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();
  const { openLoginModal } = useAuthModal();
  
  // --- FIX 1: Add a new ref for the scrolling container ---
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = React.useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  const [showChannelForm, setShowChannelForm] = React.useState(false);
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [showPostTypeMenu, setShowPostTypeMenu] = React.useState(false);
  const [selectedPostType, setSelectedPostType] = React.useState<'create-post' | 'tip-tube' | 'tip-shorts'>('tip-tube');
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [hasCompanies, setHasCompanies] = React.useState<boolean | null>(null);
  const [isCheckingCompanies, setIsCheckingCompanies] = React.useState(false);
  const [showSellerDialog, setShowSellerDialog] = React.useState(false);

  const handleLogout = async () => {
    try {
      if (user?.id) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/logout`,
          { id: user.id },
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        ).catch(() => {});
      }
    } catch (error) {
      // Ignore API errors
    } finally {
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
      logout();
      openLoginModal();
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const baseNavItems = [
    { to: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/watch", label: "TipTube", icon: <Play className="h-5 w-5" /> },
    { to: "/short", label: "TipShorts", icon: <Video className="h-5 w-5" /> },
    { to: "/livestream", label: "LiveStream", icon: <Radio className="h-5 w-5" /> },
  ];

  const [mainNavItems, setMainNavItems] = React.useState(baseNavItems);

  React.useEffect(() => {
    function buildNavItems() {
      const channels: Channel[] = JSON.parse(localStorage.getItem("channels") || "[]");
      const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;
      let items = [...baseNavItems];
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

  const handleChannelCreated = (formData: ChannelFormData) => {
    if (formData.channelId) {
      updateUser({ channelId: formData.channelId });
      localStorage.setItem("channels", JSON.stringify([formData]));
    }
  };
  
  // --- FIX 2: Update scroll handler to use the new ref ---
  const handleWheel = React.useCallback((e: WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  }, []);

  // This useEffect correctly adds the listener to the whole sidebar area
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

  React.useEffect(() => {
    const fetchChannel = async () => {
      try {
        if (!user?.id || !user?.accessToken) return;
        const response = await userAPI.getChannel(String(user.id));
        if (response.data?.data?.[0]?.channelId) {
          const channel = response.data.data[0];
          setChannelData(channel);
          updateUser({
            ...user,
            channelId: channel.channelId.toString()
          });
          localStorage.setItem("channels", JSON.stringify([channel]));
        }
      } catch (error: any) {
        console.error('Channel fetch error:', error);
        if (error.response?.status === 401) {
          updateUser({ channelId: null });
          localStorage.removeItem("channels");
        }
      }
    };
    if (user?.id) {
      fetchChannel();
    }
  }, [user?.id, user?.accessToken]);

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
        if (error.response?.status === 404 ||
          error.response?.data?.message?.includes('not found')) {
          setHasCompanies(false);
        } else {
          setHasCompanies(null);
        }
      } finally {
        setIsCheckingCompanies(false);
      }
    };
    checkUserCompanies();
  }, [user?.id]);

  // Close mobile sidebar on route change only
  React.useEffect(() => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname]); // Only depend on pathname changes

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isMobile && openMobile) {
      document.body.classList.add('mobile-sidebar-open');
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        document.body.classList.remove('mobile-sidebar-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobile, openMobile]);

  const ecommerceItems = [
    { to: "/tip-shop", label: "Tip Shop", icon: <ShoppingCart className="h-5 w-5" /> },
    ...(channelData?.channelId
      ? [{ to: `/analytics`, label: "Analysis", icon: <BarChart3 className="h-5 w-5" /> }]
      : []),
    { to: "/follow", label: "Follow", icon: <Users className="h-5 w-5" /> },
    { 
      to: user ? "/wallet" : "#", 
      label: "My Wallet", 
      icon: <Wallet className="h-5 w-5" />,
      onClick: user ? undefined : () => openLoginModal(),
      special: !user
    },
    ...(hasCompanies !== null
      ? [{
        to: hasCompanies ? "/seller/dashboard" : "#",
        label: "Seller Dashboard",
        icon: <Building2 className="h-5 w-5" />,
        onClick: hasCompanies ? undefined : () => setShowSellerDialog(true),
        special: !hasCompanies
      }]
      : []),
    { to: "/become-seller", label: "Become Advertiser", icon: <Store className="h-5 w-5" />, external: true },
    { to: "/post-ads", label: "Post Advertisements", icon: <BadgeDollarSign className="h-5 w-5" /> },
    { to: "/publisher", label: "Publisher", icon: <Newspaper className="h-5 w-5" /> },
    { to: "/publisher-dashboard", label: "Publisher Dashboard", icon: <Layout className="h-5 w-5" /> },
    { to: "/chooseplan", state: { openCreatorPacks: true }, label: "Premium Upgrade", icon: <Crown className="h-5 w-5" /> },
    { to: "/seller/ad-orders", label: "My Ad Orders", icon: <Package className="h-5 w-5" /> },
    { to: "/seller/ads-cart", label: "Cart", icon: <ShoppingCart className="h-5 w-5" /> },
    { to: "/marketplace/cart", label: "Marketplace Cart", icon: <ShoppingCart className="h-5 w-5" /> },
    { to: "/marketplace/favorites", label: "Favorites", icon: <Heart className="h-5 w-5" /> },
  ];

  const supportItems = [
    { to: "/refer", label: "Refer & Earn", icon: <Gift className="h-5 w-5" /> },
    { to: "/contact-us", label: "Contact Us", icon: <MessageSquare className="h-5 w-5" /> },
    { to: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
    { to: "/terms", label: "Terms & Conditions", icon: <FileText className="h-5 w-5" /> },
  ];

  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  const sidebarContent = (
    <div>
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
              "mb-8 w-full bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] shadow-2xl hover:shadow-3xl transition-all duration-300 text-white font-semibold backdrop-blur-sm border border-white/30 rounded-2xl",
              "px-5 py-4 flex items-center justify-center gap-3 hover:scale-[1.02]"
            )}
            style={{
              boxShadow: '0 12px 40px rgba(0, 220, 170, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
            onClick={() => {
              if (!user || user.channelId === undefined) return;
              const hasChannel = !!(channelData?.channelId || user.channelId);
              if (!hasChannel) {
                setShowChannelForm(true);
                setShowCreatePost(false);
                setShowPostTypeMenu(false);
                setIsCreatePostOpen(true);
              } else {
                setShowPostTypeMenu(true);
                setShowCreatePost(false);
                setShowChannelForm(false);
                setIsCreatePostOpen(true);
              }
            }}
          >
            <PlusCircle className="h-5 w-5" />
            <span>{user?.channelId ? "Upload Content" : "Create Channel"}</span>
          </Button>
        </DialogTrigger>

        {!user?.channelId && showCreatePost && (
          <SubmissionForm
            onSuccess={(data) => {
              const channelData: ChannelFormData = {
                channelName: data.name,
                description: data.comment,
              };
              handleChannelCreated(channelData);
              setShowCreatePost(false);
              setShowChannelForm(true);
            }}
          />
        )}
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
      <div className="space-y-6">
        <SidebarGroup>
          <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/20 dark:bg-gray-800/25 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-600/30 mx-2 mb-2 shadow-lg" style={{
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}>
            Menu
          </div>
          <SidebarGroupContent>
            {mainNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  if (!isMobile && !isCollapsed) toggleSidebar();
                }}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-800/25 hover:backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] group border border-transparent hover:border-white/20 dark:hover:border-gray-600/30 mx-2",
                  isActive(item.to) && "bg-white/25 dark:bg-gray-800/30 text-[#00dcaa] dark:text-[#00dcaa] font-semibold shadow-xl border-white/30 dark:border-gray-600/40 backdrop-blur-sm"
                )}
              >
                {React.cloneElement(item.icon, {
                  className: cn(
                    "h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3",
                    isActive(item.to) && "text-[#00dcaa] scale-110"
                  )
                })}
                <span className="text-sm font-medium select-none">{item.label}</span>
              </Link>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/20 dark:bg-gray-800/25 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-600/30 mx-2 mb-2 shadow-lg" style={{
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}>
            E-commerce
          </div>
          <SidebarGroupContent>
            {ecommerceItems.map((item) => {
              if (item.special && item.onClick) {
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      item.onClick!();
                      if (isMobile) setOpenMobile(false);
                      if (!isMobile && !isCollapsed) toggleSidebar();
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-800/25 hover:backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] w-full text-left group border border-transparent hover:border-white/20 dark:hover:border-gray-600/30 mx-2"
                    )}
                  >
                    {React.cloneElement(item.icon, { className: "h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3" })}
                    <span className="text-sm font-medium select-none">{item.label}</span>
                  </button>
                );
              }
              if (item.state) {
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      navigate(item.to, { state: item.state });
                      if (isMobile) setOpenMobile(false);
                      if (!isMobile && !isCollapsed) toggleSidebar();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 w-full text-left group",
                      isActive(item.to) && "bg-gradient-to-r from-[#00dcaa]/10 to-[#00b894]/10 text-[#00dcaa] dark:text-[#00dcaa] font-semibold shadow-sm"
                    )}
                  >
                    {React.cloneElement(item.icon, {
                      className: cn(
                        "h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3",
                        isActive(item.to) && "text-[#00dcaa]"
                      )
                    })}
                    <span className="text-sm font-medium select-none">{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    if (!isMobile && !isCollapsed) toggleSidebar();
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-800/25 hover:backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] group border border-transparent hover:border-white/20 dark:hover:border-gray-600/30 mx-2",
                    isActive(item.to) && "bg-white/25 dark:bg-gray-800/30 text-[#00dcaa] dark:text-[#00dcaa] font-semibold shadow-xl border-white/30 dark:border-gray-600/40 backdrop-blur-sm"
                  )}
                >
                  {React.cloneElement(item.icon, {
                    className: cn(
                      "h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3",
                      isActive(item.to) && "text-[#00dcaa]"
                    )
                  })}
                  <span className="text-sm font-medium select-none">{item.label}</span>
                </Link>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>
        {user && (
          <SidebarGroup>
            <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/20 dark:bg-gray-800/25 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-600/30 mx-2 mb-2 shadow-lg" style={{
              backdropFilter: 'blur(12px) saturate(180%)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}>
              Support
            </div>
            <SidebarGroupContent>
              {supportItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    if (!isMobile && !isCollapsed) toggleSidebar();
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-white/20 dark:hover:bg-gray-800/25 hover:backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] group border border-transparent hover:border-white/20 dark:hover:border-gray-600/30 mx-2",
                    isActive(item.to) && "bg-white/25 dark:bg-gray-800/30 text-[#00dcaa] dark:text-[#00dcaa] font-semibold shadow-xl border-white/30 dark:border-gray-600/40 backdrop-blur-sm"
                  )}
                >
                  {React.cloneElement(item.icon, {
                    className: cn(
                      "h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3",
                      isActive(item.to) && "text-[#00dcaa]"
                    )
                  })}
                  <span className="text-sm font-medium select-none">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={() => setShowLogoutDialog(true)}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3.5 w-full text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-red-50/30 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 hover:backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] group border border-transparent hover:border-red-200/30 dark:hover:border-red-800/30 mx-2"
                )}
              >
                <LogOut className="h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3" />
                <span className="text-sm font-medium select-none">Logout</span>
              </button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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

  return (
    <>
      {/* Mobile Sidebar with Backdrop Overlay */}
      {isMobile && openMobile && (
        <>
          {/* Backdrop Overlay - Higher z-index than filters */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300"
            onClick={() => setOpenMobile(false)}
          />
          
          {/* Mobile Sidebar Panel */}
          <aside
            ref={sidebarRef}
            className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-80 z-[101] shadow-2xl transition-all duration-300 ease-out transform"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Background with enhanced liquid glass effect */}
            <div
              className="absolute inset-0 bg-white/15 dark:bg-gray-900/20 backdrop-blur-2xl border-r border-white/25 dark:border-gray-600/35"
              style={{
                backdropFilter: 'blur(16px) saturate(200%) contrast(110%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%) contrast(110%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
            />
            <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 dark:via-gray-600/30 to-transparent opacity-60" />

            {/* Scrollable Content Container */}
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-y-auto px-5 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="adtip-sidebar h-full py-6">
                {sidebarContent}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && !isCollapsed && (
        <>
          <div
            className="fixed inset-0 top-20 bg-black/10 backdrop-blur-[2px] z-40 transition-opacity duration-300"
            onClick={toggleSidebar}
          />
          
          <aside
            ref={sidebarRef}
            className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-72 flex-col z-50 shadow-2xl transition-all duration-300 ease-out transform"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Background with enhanced liquid glass effect */}
            <div
              className="absolute inset-0 bg-white/15 dark:bg-gray-900/20 backdrop-blur-2xl border-r border-white/25 dark:border-gray-600/35"
              style={{
                backdropFilter: 'blur(16px) saturate(200%) contrast(110%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%) contrast(110%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
            />
            <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 dark:via-gray-600/30 to-transparent opacity-60" />

            {/* Scrollable Content Container */}
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-y-auto px-5 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="adtip-sidebar h-full py-6">
                {sidebarContent}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default AdTipSidebar;

/* Add this to your global CSS if not already present:
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
*/