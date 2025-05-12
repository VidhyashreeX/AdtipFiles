import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Video,
  Clapperboard,
  PhoneCall,
  Users,
  Wallet,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const AdTipSidebar = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const location = useLocation();

  // Navigation items
  const navItems = [
    { to: "/home", label: "Home", icon: <Home className="h-4 w-4" /> },
    { to: "/tiptube", label: "TipTube", icon: <Video className="h-4 w-4" /> },
    { to: "/tipshort", label: "TipShort", icon: <Clapperboard className="h-4 w-4" /> },
    { to: "/tipcall", label: "TipCall", icon: <PhoneCall className="h-4 w-4" /> },
    { to: "/follow", label: "Follow", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <Sidebar side="left" collapsible="icon">
      {/* Header: Profile and Search */}
      <SidebarHeader>
        {/* Profile */}
        <Link to="/profile" className="flex items-center gap-2 p-2">
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
          <span className="text-sm font-medium text-gray-800 truncate">
            {user?.name || "User"}
          </span>
        </Link>

        {/* Search Bar */}
        <SidebarInput
          placeholder="Search users or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-100"
        />

        {/* Wallet */}
        <Link to="/wallet" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
          <Wallet className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            ₹{user?.wallet || "0"}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation Menu */}
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                isActive={location.pathname === item.to}
                className={location.pathname === item.to ? "text-adtip-teal" : ""}
              >
                <Link to={item.to}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer: Logo */}
      <SidebarFooter>
        <Link to="/home" className="flex items-center gap-2 p-2">
          <img src="logo.png" alt="AdTip Logo" className="h-6 w-6" />
          <span className="text-lg font-bold text-adtip-teal">AdTip</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdTipSidebar;