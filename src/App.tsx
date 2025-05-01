
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();
  
  // Don't show navbar on onboarding and auth pages
  const isAuthPage = 
    location.pathname === "/" || 
    location.pathname === "/onboarding" ||
    location.pathname === "/login" || 
    location.pathname === "/verify-otp" ||
    location.pathname === "/personal-details" ||
    location.pathname === "/interests";
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-background flex flex-col">
            {!isAuthPage && <Navbar />}
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
