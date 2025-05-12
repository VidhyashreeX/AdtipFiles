
import * as React from "react";
import { SidebarProvider } from "./components/ui/sidebar-components";
import AdTipSidebar from "./components/ui/AdTipSidebar";
import Navbar from "./components/Navbar"; 

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        {/* Top Navigation Bar */}
        <Navbar />

        <div className="flex flex-1 w-full">
          {/* Left Sidebar */}
          <AdTipSidebar />
          
          {/* Main Content */}
          <div className="flex flex-col flex-1 overflow-x-hidden">
            {/* Page Content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
