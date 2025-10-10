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
      {/* Sidebar - overlay, doesn't affect content layout */}
      <AdTipSidebar />
      
      {/* Main content - full width always, no margin */}
      <main className="flex-1 min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

const AppLayout = () => (
  <SidebarProvider>
    <AppLayoutContent />
  </SidebarProvider>
);

export default AppLayout;
