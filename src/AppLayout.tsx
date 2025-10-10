import * as React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdTipSidebar from "./components/ui/AdTipSidebar";
import Navbar from "./components/Navbar";
import { cn } from "./lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { useAuth } from "./contexts/AuthContext";

const AppLayoutContent = () => {
  const { isAuthenticated, authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adtip-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access regardless of authentication status

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex relative pt-16">
        {/* Sidebar container - completely hidden when collapsed on desktop */}
        <div className={cn(
          "md:relative",
          isMobile ? "fixed left-0 top-16 bottom-0 z-30" : "sticky top-16 h-[calc(100vh-4rem)]"
        )}>
          <AdTipSidebar />
        </div>
        {/* Main content - takes full width when sidebar is collapsed */}
        <main
          className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-500 ease-in-out bg-gray-50 dark:bg-gray-950 px-4 md:px-6",
            // Remove left margin when collapsed to allow content to use full width
            !isMobile && !isCollapsed && "ml-0"
          )}
          style={{ 
            marginLeft: isMobile ? 0 : isCollapsed ? 0 : 256,
            // Smooth transition for margin
            transitionProperty: 'margin-left',
            transitionDuration: '500ms',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout = () => (
  <SidebarProvider>
    <AppLayoutContent />
  </SidebarProvider>
);

export default AppLayout;
