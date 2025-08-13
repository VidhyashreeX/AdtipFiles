import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home, Play, Video, Phone, Users, Settings,
  PlusCircle, Gift, MessageSquare, FileText,
  ShoppingCart, BarChart3, Wallet, Store,
  User, Package, Heart, BadgeDollarSign,
  Layout, Crown
} from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreatePostDialog from "../CreatePostDialog";
import { useSidebar } from "../../contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "./sidebar-components";
import postAdsLogo from '/logo.png'; // Use your Post Advertisers logo path here

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
  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  const { isCollapsed, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
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

  // Handler for Install to Earn
  /*const handleInstallToEarn = (e: React.MouseEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId') || '58422';
    const url = `https://wow.pubscale.com/?app_id=39604779&user_id=${userId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };*/

  // Main navigation items
  const mainNavItems = [
    { to: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/tiptube", label: "TipTube", icon: <Play className="h-5 w-5" /> },
    { to: "/short", label: "TipShorts", icon: <Video className="h-5 w-5" /> },
    { to: "/tipcall", label: "TipCall", icon: <Phone className="h-5 w-5" /> },
    // Install to Earn menu item (no route, just action)
    /*{
      to: "#install-to-earn",
      label: "Install to Earn",
      icon: <BadgeDollarSign className="h-5 w-5" />,
      onClick: handleInstallToEarn,
      isInstallToEarn: true,
    },*/
  ];
  
  // E-commerce items
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

  // Main sidebar content
  const sidebarContent = (
    <div>
      {/* Post button or icon */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogTrigger asChild>
          <Button
            className={cn(
              "mb-4 bg-adtip-teal hover:bg-adtip-teal/90",
              isCollapsed && !isMobile
                ? "mx-2 w-[48px] h-[40px] flex items-center justify-center p-0"
                : "w-[calc(100%-32px)] mx-4 px-4 py-2"
            )}
          >
            {isCollapsed && !isMobile ? (
              <PlusCircle className="h-5 w-5" />
            ) : (
              <>
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Post
              </>
            )}
          </Button>
        </DialogTrigger>
        <CreatePostDialog onClose={() => setIsCreatePostOpen(false)} />
      </Dialog>

      {/* Navigation Groups */}
      <div className="space-y-5"> {/* Increased vertical spacing */}
        {/* Main Nav Group */}
        <SidebarGroup>
          {!(isCollapsed && !isMobile) && (
            <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/70">Menu</div>
          )}
          <SidebarGroupContent>
            {mainNavItems.map((item) =>
              /*item.isInstallToEarn ? (
                <a
                  key={item.label}
                  href="#install-to-earn"
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-0 py-3 text-gray-500 transition-all hover:text-gray-900 cursor-pointer",
                    isCollapsed && !isMobile && "justify-center px-0"
                  )}
                  tabIndex={0}
                  role="button"
                >
                  {item.icon}
                  {(!isCollapsed || isMobile) && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </a>
              )*/(
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
              )
            )}
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
          </SidebarGroupContent>
        </SidebarGroup>
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
