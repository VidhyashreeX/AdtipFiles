
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface VideoLoginPromptProps {
  onClose: () => void;
}

const VideoLoginPrompt = ({ onClose }: VideoLoginPromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white w-11/12 max-w-md rounded-lg p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500"
        >
          <X size={20} />
        </button>
        
        <div className="flex justify-center mb-4">
          <img src="logo.png" alt="AdTip Logo" className="h-16 w-16" />
        </div>
        
        <h2 className="text-xl font-bold text-center mb-3">Join AdTip to continue</h2>
        <p className="text-gray-600 text-center mb-6">
          Sign up to watch unlimited videos and start earning while you watch!
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/login")}
            className="teal-button w-full"
          >
            Log In
          </Button>
          
          <Button 
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full border-adtip-teal text-adtip-teal hover:bg-adtip-teal/10"
          >
            Sign Up
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-adtip-teal">Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" className="text-adtip-teal">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoLoginPrompt;
