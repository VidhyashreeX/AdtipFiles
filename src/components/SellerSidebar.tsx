import React from 'react';
import { 
  Home, 
  Table, 
  Upload, 
  BarChart3, 
  Users, 
  Wallet, 
  UserCircle,
  MessageSquare,
  Megaphone,
  TrendingUp
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: "Home",
    url: "/seller-dashboard",
    icon: Home,
  },
  {
    title: "Tables",
    url: "#",
    icon: Table,
  },
  {
    title: "Uploads",
    url: "#",
    icon: Upload,
  },
  {
    title: "PayPal",
    url: "#",
    icon: Wallet,
  }
];

const ecommerceItems = [
  {
    title: "Tik Shop",
    url: "#",
    icon: MessageSquare,
  },
  {
    title: "Analysis",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Follow",
    url: "#",
    icon: Users,
  }
];

const advertiserItems = [
  {
    title: "My Wallet",
    url: "#",
    icon: Wallet,
  },
  {
    title: "Advertiser Brief",
    url: "#",
    icon: UserCircle,
  },
  {
    title: "Post Advertisers",
    url: "#",
    icon: Megaphone,
  },
  {
    title: "Premium Upgrade",
    url: "#",
    icon: TrendingUp,
  }
];

export function SellerSidebar() {
  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#00dcaa] rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">▶</span>
          </div>
          <span className="text-xl font-bold text-[#00dcaa]">AdTip</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <a href={item.url} className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-[#f5f5ff] hover:text-[#00dcaa] rounded-lg transition-colors">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            E-COMMERCE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ecommerceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <a href={item.url} className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-[#f5f5ff] hover:text-[#00dcaa] rounded-lg transition-colors">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ADVERTISER
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advertiserItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <a href={item.url} className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-[#f5f5ff] hover:text-[#00dcaa] rounded-lg transition-colors">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center space-x-3 p-2 text-gray-700">
          <UserCircle className="w-8 h-8" />
          <div className="flex-1">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-gray-500">admin@adtip.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}