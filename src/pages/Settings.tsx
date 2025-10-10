import React from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Languages, 
  Phone, 
  HelpCircle,
  ChevronRight,
  LogOut,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

   const handleLogout = async () => {
    try {
      if (user?.id) {
        // Call logout API, but don't block on it
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/logout`,
          { id: user.id },
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          }
        ).catch(() => {}); // Ignore API errors
      }
    } catch (error) {
      // Ignore API errors, always perform local logout
    } finally {
      // Always clear all localStorage keys related to auth
      localStorage.removeItem("user");
      localStorage.removeItem("UserLoggedIn");
      localStorage.removeItem("UserId");
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      localStorage.removeItem("profileImage");
      localStorage.removeItem("gender");
      localStorage.removeItem("profession");
      localStorage.removeItem("maritalStatus");
      localStorage.removeItem("age");
       localStorage.removeItem("channels");
      // Call AuthContext logout to clear context state
      logout();
      // Redirect to login
      navigate("/login");
    }
  };

  const handleCallSupport = () => {
    window.location.href = "tel:+918148147172";
  };

  const handleEmailSupport = () => {
    window.location.href = "mailto:support@adtip.in";
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Settings</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        {/* Account Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">ACCOUNT</h3>
          <div className="bg-white dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
            <button 
              className="w-full flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => navigate("/edit-profile")}
            >
              <div className="flex items-center">
                <User className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Edit Profile</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Notifications</span>
              </div>
              <Switch 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Languages className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Language</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">English</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* App Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">APP SETTINGS</h3>
          <div className="bg-white dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Privacy</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            
            <button 
              className="w-full flex items-center justify-between p-4"
              onClick={() => {
                setDarkModeEnabled(!darkModeEnabled);
                toast({
                  title: `${darkModeEnabled ? "Light" : "Dark"} mode activated`,
                  description: "Theme preference saved",
                });
              }}
            >
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Dark Mode</span>
              </div>
              <Switch 
                checked={darkModeEnabled}
                onCheckedChange={setDarkModeEnabled}
              />
            </button>
          </div>
        </div>
        
        {/* Contact & Support */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">CONTACT & SUPPORT</h3>
          <div className="bg-white dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
            <button 
              className="w-full flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => navigate("/contact-us")}
            >
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Contact Us</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 border-b"
              onClick={handleEmailSupport}
            >
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Email Us</span>
              </div>
              <div className="text-gray-500 text-sm">
                support@adtip.in
              </div>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 border-b"
              onClick={handleCallSupport}
            >
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Call Us</span>
              </div>
              <div className="text-gray-500 text-sm">
                +91 8148147172
              </div>
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4 border-b"
              onClick={() => navigate("/terms")}
            >
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Terms of Service</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-4"
              onClick={() => navigate("/privacy")}
            >
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-adtip-teal mr-3" />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Version Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Version 1.0.0</p>
          <p>© 2025 AdTip. All rights reserved.</p>
        </div>
        
        {/* Log Out Button */}
        <Button 
          variant="outline" 
          className="w-full border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Log Out
        </Button>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out of AdTip</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You'll need to enter your phone number and OTP to log back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="sm:flex-1" 
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="sm:flex-1" 
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
