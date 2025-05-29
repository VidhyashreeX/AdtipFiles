import * as React from "react";
import { Outlet } from "react-router-dom";
import AdTipSidebar from "./components/ui/AdTipSidebar";
import Navbar from "./components/Navbar";
import { cn } from "./lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";

const AppLayoutContent = () => {
  const isMobile = useIsMobile();
  const { isCollapsed } = useSidebar();
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
