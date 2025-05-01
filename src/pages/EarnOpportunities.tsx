
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Gift, Award, ShoppingBag, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const EarnOpportunities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleContinue = () => {
    toast({
      title: "Welcome to AdTip!",
      description: "Start earning by watching ads and creating content."
    });
    navigate("/home");
  };

  return (
    <div className="min-h-screen p-6 bg-white flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-6">Ways to Earn with AdTip</h1>
      <p className="text-gray-500 text-center mb-8">
        Choose from multiple ways to earn money while enjoying content you love
      </p>
      
      <div className="space-y-4 flex-1">
        {/* Refer & Earn Card */}
        <Card className="p-5 border-l-4 border-l-pink-500">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
              <Gift className="h-6 w-6 text-pink-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Refer & Earn</h3>
              <p className="text-gray-600 text-sm">
                Get ₹3 for every successful referral and earn ₹30 for each premium upgrade
              </p>
            </div>
            <ChevronRight className="ml-auto text-gray-400" />
          </div>
        </Card>
        
        {/* Premium Card */}
        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Premium</h3>
              <p className="text-gray-600 text-sm">
                Upgrade to Premium and get ₹5/- for 1 minute (₹300/- for 1 hour). Boost your earnings!
              </p>
            </div>
            <ChevronRight className="ml-auto text-gray-400" />
          </div>
        </Card>
        
        {/* Upload Card */}
        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Upload</h3>
              <p className="text-gray-600 text-sm">
                Upload video to get ₹100 for 10000 views. (₹10/- for 1 minute)
              </p>
            </div>
            <ChevronRight className="ml-auto text-gray-400" />
          </div>
        </Card>
        
        {/* Sell Products Card */}
        <Card className="p-5 border-l-4 border-l-green-500">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-lg">Sell your Product</h3>
              <p className="text-gray-600 text-sm">
                Get ₹5/- for 1 minute (₹300/- for 1 hour). Accept call get ₹5/- for 1 minute
              </p>
            </div>
            <ChevronRight className="ml-auto text-gray-400" />
          </div>
        </Card>
      </div>
      
      <Button 
        onClick={handleContinue} 
        className="teal-button w-full mt-8"
      >
        Continue to AdTip
      </Button>
    </div>
  );
};

export default EarnOpportunities;
