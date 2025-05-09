import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./UserContext"; // ✅ Import the UserProvider
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();

  // Define an array of authentication-related paths for easier scalability
  const authPages = [
    "/",
    "/onboarding",
    "/login",
    "/verify-otp",
    "/personal-details",
    "/interests",
  ];

  const isAuthPage = authPages.includes(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider> {/* ✅ Wrap AuthProvider with UserProvider */}
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="min-h-screen bg-background flex flex-col">
              {/* Conditionally render the Navbar based on whether it's an auth page */}
              {!isAuthPage && <Navbar />}
              <main className="flex-1">
                <Outlet />
              </main>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;
