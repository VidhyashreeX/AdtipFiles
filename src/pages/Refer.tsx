import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share, Copy, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Refer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Generate a referral code based on user ID or default
  let referralCode = "ADTIPNEW";
  if (user?.id) {
    const idStr = typeof user.id === "string" ? user.id : String(user.id);
    referralCode = `ADTIP${idStr.substring(0, 6).toUpperCase()}`;
  }
  const referralLink = `https://adtip.app/r/${referralCode}`;

  // Total money earned from referrals (assuming it's part of the user data)
  const totalReferralEarnings = user?.referralEarnings || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: "Share this link with your friends to earn rewards",
    });
    
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on AdTip!',
        text: 'Join AdTip and we both earn rewards. Watch videos, create content, and make money!',
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Refer & Earn</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-10 w-10 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Friends, Earn Cash</h2>
          <p className="text-gray-600">
            Both you and your friend get rewarded when they join AdTip
          </p>
        </div>

        {/* Rewards */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 text-center">Your Rewards</h3>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-adtip-teal">₹3</div>
              <p className="text-sm text-gray-600">Per Referral</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-adtip-teal">₹30</div>
              <p className="text-sm text-gray-600">Per Premium Upgrade</p>
            </div>
          </div>
        </Card>

        {/* Referral Link */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Your referral link</p>
          <div className="flex">
            <div className="flex-1 bg-gray-50 border rounded-l-md p-3 overflow-hidden text-ellipsis">
              {referralLink}
            </div>
            <Button 
              onClick={handleCopy} 
              variant="outline"
              className="rounded-l-none border-l-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Your referral code</p>
          <div className="flex">
            <div className="flex-1 bg-gray-50 border rounded-l-md p-3 font-medium">
              {referralCode}
            </div>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                toast({
                  title: "Code copied",
                  description: "Share this code with your friends",
                });
              }}
              variant="outline"
              className="rounded-l-none border-l-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Total Money Earned */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 text-center">Total Earnings</h3>
          <div className="flex justify-center">
            <div className="text-3xl font-bold text-adtip-teal">₹{totalReferralEarnings}</div>
          </div>
        </Card>

        {/* Share */}
        <Button 
          className="teal-button w-full"
          onClick={handleShare}
        >
          <Share className="h-5 w-5 mr-2" />
          Share Your Invitation
        </Button>

        {/* How it works */}
        <div className="mt-8">
          <h3 className="font-medium text-lg mb-4">How it works</h3>
          <ol className="space-y-4">
            <li className="flex">
              <span className="bg-gray-100 h-6 w-6 rounded-full flex items-center justify-center font-medium text-gray-600 mr-3">1</span>
              <span className="text-gray-700">Share your referral link or code with friends</span>
            </li>
            <li className="flex">
              <span className="bg-gray-100 h-6 w-6 rounded-full flex items-center justify-center font-medium text-gray-600 mr-3">2</span>
              <span className="text-gray-700">Friends sign up using your link or code</span>
            </li>
            <li className="flex">
              <span className="bg-gray-100 h-6 w-6 rounded-full flex items-center justify-center font-medium text-gray-600 mr-3">3</span>
              <span className="text-gray-700">You get ₹3 for each successful referral</span>
            </li>
            <li className="flex">
              <span className="bg-gray-100 h-6 w-6 rounded-full flex items-center justify-center font-medium text-gray-600 mr-3">4</span>
              <span className="text-gray-700">If they upgrade to Premium, you get ₹30 more</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Refer;
