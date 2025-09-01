import * as React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdTipSidebar from "./components/ui/AdTipSidebar";
import Navbar from "./components/Navbar";
import { cn } from "./lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { useAuthValidation } from "@/hooks/useAuthValidation";
import { useAuth } from "./contexts/AuthContext";

const AppLayoutContent = () => {
  useAuthValidation();
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🔐 User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex relative pt-16">
        <div className={cn(
          "md:relative",
          isMobile ? "fixed left-0 top-16 bottom-0 z-30" : "sticky top-16 h-[calc(100vh-4rem)]"
        )}>
          <AdTipSidebar />
        </div>
        <main
          className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out",
            isMobile ? "px-4 ml-0" : isCollapsed ? "ml-16" : "ml-64"
          )}
          style={{ marginLeft: isMobile ? 0 : isCollapsed ? 64 : 256 }}
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
