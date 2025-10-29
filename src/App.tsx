import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";
import { AxiosError } from "axios";
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

// Enhanced React Query configuration with proper caching and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof AxiosError && error.response?.status >= 400 && error.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: true,
      // Don't refetch on mount by default (let components control this)
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

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
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
