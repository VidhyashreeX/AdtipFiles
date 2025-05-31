import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Award, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Premium = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const isPremium = user?.isPremium || false;

  const handleUpgrade = () => {
    // For demo purposes, instantly upgrade to premium
    if (isPremium) {
      toast({
        title: "Already Premium",
        description: "You're already enjoying premium benefits!",
      });
      return;
    }
    
    if ((user?.wallet || 0) < 499) {
      toast({
        title: "Insufficient balance",
        description: "Please add money to your wallet first",
        variant: "destructive",
      });
      navigate("/wallet");
      return;
    }
    
    // Update user profile
    updateUserProfile({
      isPremium: true,
      wallet: (user?.wallet || 0) - 499,
    });
    
    toast({
      title: "Welcome to Premium!",
      description: "You've successfully upgraded to AdTip Premium",
    });
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Premium Status</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <Award className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">AdTip Premium</h2>
          <p className="text-gray-600">
            Unlock higher earning rates and exclusive features
          </p>
        </div>

        {/* Current Status */}
        <Card className="p-6 border-l-4 border-l-yellow-500">
          <h3 className="font-bold text-lg mb-3">Your Status</h3>
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full ${isPremium ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
              {isPremium ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="ml-4">
              <p className="font-medium">
                {isPremium ? "Premium" : "Free"} Account
              </p>
              <p className="text-sm text-gray-600">
                {isPremium 
                  ? "You're enjoying premium benefits and earning rates!" 
                  : "Upgrade to premium to maximize your earnings"}
              </p>
            </div>
          </div>
        </Card>

        {/* Comparison Table */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Compare Plans</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium">Feature</div>
              <div className="text-center font-medium">Free</div>
              <div className="text-center font-medium">Premium</div>
            </div>
            
            {/* Watch Ads Earning */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t">
              <div>Watch Ads Earnings</div>
              <div className="text-center">No earnings</div>
              <div className="text-center font-medium text-adtip-teal">₹5 per minute</div>
            </div>
            
            {/* Content Creation */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t">
              <div>Content Creation</div>
              <div className="text-center">Basic tools</div>
              <div className="text-center font-medium text-adtip-teal">Advanced tools</div>
            </div>
            
            {/* Premium Content */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t">
              <div>Access to Premium Content</div>
              <div className="text-center">Limited</div>
              <div className="text-center font-medium text-adtip-teal">Full access</div>
            </div>
            
            {/* Withdrawal Time */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t">
              <div>Withdrawal Processing</div>
              <div className="text-center">7 days</div>
              <div className="text-center font-medium text-adtip-teal">24 hours</div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="space-y-4">
          {!isPremium ? (
            <>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between">
                  <span>Premium Membership</span>
                  <span className="font-bold">₹499 / month</span>
                </div>
              </div>
              <Button 
                className="teal-button w-full"
                onClick={handleUpgrade}
              >
                Upgrade to Premium
              </Button>
            </>
          ) : (
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Return to Profile
            </Button>
          )}
        </div>

        {/* Fine Print */}
        <p className="text-xs text-gray-500 text-center">
          Premium benefits are applied immediately upon upgrading. 
          Subscription auto-renews monthly. Cancel anytime from your account settings.
        </p>
      </div>
    </div>
  );
};

export default Premium;
