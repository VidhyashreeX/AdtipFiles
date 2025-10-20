import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./UserContext";
import { ShoppingProvider } from "./contexts/ShoppingContext";
import AppLayout from "./AppLayout";
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { LoginModal } from './components/modals/LoginModal';
import { OTPModal } from './components/modals/OTPModal';

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();
  
  // Define an array of authentication-related paths for easier scalability
  const authPages = [
    "/onboarding",
    "/login",
    "/verify-otp",
    "/personal-details",
    "/interests",
    "/complete-profile", // <-- add this line
  ];

  const isAuthPage = authPages.includes(location.pathname);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AuthModalProvider>
              <UserProvider>
                <ShoppingProvider>
                  <SidebarProvider>
                    <TooltipProvider>
                      {isAuthPage ? (
                        <Outlet />
                      ) : (
                        <AppLayout />
                      )}
                      <LoginModal />
                      <OTPModal />
                      <Toaster />
                      <Sonner />
                    </TooltipProvider>
                  </SidebarProvider>
                </ShoppingProvider>
              </UserProvider>
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
