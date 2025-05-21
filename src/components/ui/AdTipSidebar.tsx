
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  Play,
  Video,
  Phone,
  Users,
  Settings,
  PlusCircle,
  Gift,
  ArrowUpRight,
  Crown,
  MessageSquare,
  FileText,
  ShoppingCart,
  BarChart3,
  Wallet,
  Store,
  BadgeDollarSign,
  Layout,
  User,
  Package,
  Heart,
  ShoppingBag,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreatePostDialog from "../CreatePostDialog";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroupLabel,
  useSidebar,
  SidebarGroup,
  SidebarGroupContent,
} from "./sidebar-components";
import { cn } from "@/lib/utils";

// Define props for SidebarComponent to avoid type errors
interface SidebarProps {
  side?: "left" | "right";
  collapsible?: "offcanvas" | "icon" | "none";
  className?: string;
  children: React.ReactNode;
}

const AdTipSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  const { state } = useSidebar(); // Use the sidebar context to check expanded/collapsed state

  // Main navigation items
  const mainNavItems = [
    { to: "/home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { to: "/tiptube", label: "TipTube", icon: <Play className="h-5 w-5" /> },
    { to: "/tipshort", label: "TipShort", icon: <Video className="h-5 w-5" /> },
    { to: "/tipcall", label: "TipCall", icon: <Phone className="h-5 w-5" /> },
  ];
  
  // E-commerce items
  const ecommerceItems = [
    { to: "/tip-shop", label: "Tip Shop", icon: <ShoppingCart className="h-5 w-5" /> },
    { to: "/analysis", label: "Analysis", icon: <BarChart3 className="h-5 w-5" /> },
    { to: "/follow", label: "Follow", icon: <Users className="h-5 w-5" /> },
    { to: "/wallet", label: "My Wallet", icon: <Wallet className="h-5 w-5" /> },
    { to: "/become-seller-full", label: "Become Seller", icon: <Store className="h-5 w-5" />, external: true },
    { to: "/post-ads", label: "Post Advertisers", icon: <BadgeDollarSign className="h-5 w-5" /> },
    { to: "/premium-content", label: "Premium Content", icon: <Layout className="h-5 w-5" /> },
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

  return (
    <SidebarComponent
      side="left"
      collapsible="icon"
      className="bg-white border-r border-gray-200 w-[260px] md:w-[280px] shrink-0 transition-all duration-300 ease-in-out shadow-sm"
    >
      {/* Fixed Create Post Button */}
      <div className="px-4 pt-4 pb-2 min-h-[48px] block bg-white z-10">
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogTrigger asChild>
            <Button
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg shadow-md transition-all duration-200",
                state === "expanded"
                  ? "w-full bg-gradient-to-r from-adtip-teal to-teal-500 hover:from-adtip-teal/90 hover:to-teal-600 text-white py-3"
                  : "w-8 h-8 bg-gradient-to-r from-adtip-teal to-teal-500 hover:from-adtip-teal/90 hover:to-teal-600 text-white p-0 mx-auto"
              )}
            >
              <PlusCircle className="h-5 w-5" />
              {state === "expanded" && (
                <span className="font-semibold text-sm">Create Post</span>
              )}
            </Button>
          </DialogTrigger>
          <CreatePostDialog onClose={() => setIsCreatePostOpen(false)} />
        </Dialog>
      </div>

      {/* Scrollable Navigation Area */}
      <SidebarContent
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 group-data-[collapsible=icon]:overflow-visible"
        style={{ maxHeight: "calc(100vh - 4rem - 48px - 120px)" }} // Adjusted for heading bar (4rem), Create Post button (48px), and footer (120px)
      >
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={location.pathname === item.to}
                    className={`flex items-center justify-start pl-4 pr-2 py-2 gap-3 w-full text-left transition-all duration-150 ${
                      location.pathname === item.to
                        ? "bg-adtip-teal/10 text-adtip-teal font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Link to={item.to} className="flex items-center gap-3 w-full">
                      {item.icon}
                      <span className="text-sm font-bold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />

        {/* E-Commerce Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {ecommerceItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={location.pathname === item.to}
                    className={`flex items-center justify-start pl-4 pr-2 py-2 gap-3 w-full text-left transition-all duration-150 ${
                      location.pathname === item.to
                        ? "bg-adtip-teal/10 text-adtip-teal font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.external ? (
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 w-full"
                      >
                        {item.icon}
                        <span className="text-sm font-bold">{item.label}</span>
                      </a>
                    ) : (
                      <Link to={item.to} className="flex items-center gap-3 w-full">
                        {item.icon}
                        <span className="text-sm font-bold">{item.label}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Support Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Support & Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={location.pathname === item.to}
                    className={`flex items-center justify-start pl-4 pr-2 py-2 gap-3 w-full text-left transition-all duration-150 ${
                      location.pathname === item.to
                        ? "bg-adtip-teal/10 text-adtip-teal font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Link to={item.to} className="flex items-center gap-3 w-full">
                      {item.icon}
                      <span className="text-sm font-bold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile - Outside Scrollable Area */}
      <SidebarFooter className="mt-auto p-4 border-t border-gray-100">
        <Link to="/profile" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-700">{user?.name || "User"}</span>
            <span className="text-xs text-gray-400">View profile</span>
          </div>
        </Link>
      </SidebarFooter>
    </SidebarComponent>
  );
};

export default AdTipSidebar;
