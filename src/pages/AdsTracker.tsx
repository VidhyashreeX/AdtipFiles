import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BarChart, Eye, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdsTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sample data for demonstration
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const adsWatched = user?.isPremium ? 42 : 18;
  const timeWatched = user?.isPremium ? 210 : 90; // in minutes
  const earnings = user?.isPremium ? 1050 : 0; // ₹5/min for premium users

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Ads Tracker</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Your Ads Performance</h2>
          <p className="text-gray-600">
            Track your ad watching activity and earnings
          </p>
        </div>

        {/* Summary Card */}
        <Card className="p-6">
          <h3 className="font-medium text-lg mb-4">Summary for {currentMonth}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{adsWatched}</div>
              <p className="text-sm text-gray-600">Ads Watched</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{Math.floor(timeWatched / 60)}h {timeWatched % 60}m</div>
              <p className="text-sm text-gray-600">Time Watched</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <BarChart className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">₹{earnings}</div>
              <p className="text-sm text-gray-600">Earnings</p>
            </div>
          </div>
        </Card>

        {/* Activity Log */}
        <div>
          <h3 className="font-medium text-lg mb-4">Recent Activity</h3>
          {user?.isPremium ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Ad Watched</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(Date.now() - i * 8.64e7).toLocaleDateString()} • {(5 - i)} minutes
                      </p>
                    </div>
                    <div className="text-adtip-teal font-medium">+₹{(5 - i) * 5}</div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                Premium users earn ₹5 per minute watching ads
              </div>
              <Button 
                className="teal-button"
                onClick={() => navigate("/premium")}
              >
                Upgrade to Premium
              </Button>
            </Card>
          )}
        </div>

        {!user?.isPremium && (
          <div className="p-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg text-white">
            <h3 className="text-lg font-bold mb-2">Upgrade to Premium</h3>
            <p className="mb-4">
              Premium users earn ₹5 for every minute of ad watching, that's ₹300 per hour!
            </p>
            <Button 
              variant="outline" 
              className="bg-white text-teal-600 hover:bg-gray-100 hover:text-teal-700 w-full"
              onClick={() => navigate("/premium")}
            >
              Upgrade Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsTracker;
