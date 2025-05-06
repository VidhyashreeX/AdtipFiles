import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, Award, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HowToEarnUser = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Earn as User</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Get Paid to Engage</h2>
          <p className="text-gray-600">
            Multiple ways to earn money while enjoying content on AdTip
          </p>
        </div>

        {/* Watch Videos */}
        <Card className="p-6 border-l-4 border-l-teal-500">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Eye className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Watch TipTube Videos</h3>
              <p className="text-gray-600 mb-4">
                Earn money by watching videos on TipTube. Every minute you spend consuming content adds to your earnings.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Current Rates:</p>
                <p className="text-sm">Free users: Watch ads to earn rewards</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Membership */}
        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Upgrade to Premium</h3>
              <p className="text-gray-600 mb-4">
                Premium users earn at higher rates. Upgrade your account to maximize your earning potential while watching content.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Premium Benefits:</p>
                <p className="text-sm">₹5 per minute of watch time (₹300 per hour)</p>
                <p className="text-sm">Priority access to new features</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Refer Friends */}
        <Card className="p-6 border-l-4 border-l-pink-500">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Gift className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Refer Friends</h3>
              <p className="text-gray-600 mb-4">
                Share AdTip with your friends and earn for each successful referral. Earn even more when they upgrade to premium.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Referral Rewards:</p>
                <p className="text-sm">₹3 for each successful referral</p>
                <p className="text-sm">₹30 for each premium upgrade</p>
              </div>
            </div>
          </div>
        </Card>

        <Button 
          className="teal-button w-full mt-8"
          onClick={() => navigate("/premium")}
        >
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
};

export default HowToEarnUser;