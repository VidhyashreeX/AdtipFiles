import * as React from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import AdTipSidebar from "./components/ui/AdTipSidebar";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <AdTipSidebar />
      <SidebarInset>
        <header className="flex items-center p-4 border-b">
          <SidebarTrigger className="mr-2" />
          <h1 className="text-lg font-semibold">AdTip</h1>
        </header>
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;