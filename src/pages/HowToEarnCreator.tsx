import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Award, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const HowToEarnCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Earn as Creator</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Monetize Your Content</h2>
          <p className="text-gray-600">
            Multiple ways to earn money through your content on AdTip
          </p>
        </div>

        {/* Upload Videos */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Upload className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Upload Videos</h3>
              <p className="text-gray-600 mb-4">
                Upload quality videos and earn ₹100 for every 10,000 views. The more engaging your content, the more you earn.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Earning Potential:</p>
                <p className="text-sm">₹10 per minute of user viewing time</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Content */}
        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Create Premium Content</h3>
              <p className="text-gray-600 mb-4">
                Create exclusive premium content that users pay to access. Set your price and earn directly from your dedicated fans.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Earning Potential:</p>
                <p className="text-sm">₹5 per minute of premium content viewed</p>
                <p className="text-sm">₹300 per hour of content</p>
              </div>
            </div>
          </div>
        </Card>

        {/* TipCall */}
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">TipCall Sessions</h3>
              <p className="text-gray-600 mb-4">
                Host one-on-one call sessions with fans. Share your expertise and get paid per minute for your time.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Earning Potential:</p>
                <p className="text-sm">₹5 per minute of call time</p>
                <p className="text-sm">₹300 per hour of calls</p>
              </div>
            </div>
          </div>
        </Card>

        <Button 
          className="teal-button w-full mt-8"
          onClick={() => navigate("/create-post")}
        >
          Start Creating Now
        </Button>
      </div>
    </div>
  );
};

export default HowToEarnCreator;
