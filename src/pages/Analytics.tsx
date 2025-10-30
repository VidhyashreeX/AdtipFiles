import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Users, TrendingUp, DollarSign, BarChart3, Wallet, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

interface AnalyticsData {
  channel_name: string;
  channel_image: string;
  channel_followers: number;
  total_videos: number;
  total_paid_views: number;
  total_normal_views: number;
  total_views: number;
  paid_video_earned: string;
  withdrawn: string;
  available_balance: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showPremiumAlert, setShowPremiumAlert] = useState(false);

  console.log('🔍 Analytics component loaded, user:', user?.id, 'premium:', user?.is_premium);

  const periods = [
    { id: '7d' as const, label: 'Last 7 days' },
    { id: '30d' as const, label: 'Last 30 days' },
    { id: '90d' as const, label: 'Last 3 months' },
  ];

  // Check if user has premium access
  const hasContentPremium = () => {
    const isPremium = user?.content_creator_premium_status === 1;
    console.log('🎯 Content Creator Premium check:', isPremium, 'user.content_creator_premium_status:', user?.content_creator_premium_status);
    return isPremium;
  };

  const getAuthToken = () => {
    try {
      const stored = localStorage.getItem("UserLoggedIn");
      if (!stored) return null;
      return `Bearer ${stored}`;
    } catch {
      return null;
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    const storedUserId = localStorage.getItem("UserId");
    if (!storedUserId) {
      console.error('❌ No user ID found');
      toast.error('Please log in to view analytics');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching channel data for user:', storedUserId);

      // First get user's channel using the correct endpoint
      const channelResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/getchannelbyuserid/${storedUserId}`,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📊 Channel response:', channelResponse.data);

      if (channelResponse.status === 200 && channelResponse.data?.status) {
        const channelData = channelResponse.data.data;
        
        // Handle both array and single object responses
        const channel = Array.isArray(channelData) ? channelData[0] : channelData;
        const channelId = channel?.id || channel?.channelId;
        
        console.log('📊 Found channel ID:', channelId);
        
        if (channelId) {
          // Use user ID for analytics endpoint since backend uses authenticated user ID
          const analyticsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/analytics/${storedUserId}`,
            {
              headers: {
                Authorization: token,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('📊 Analytics response:', analyticsResponse.data);

          if (analyticsResponse.status === 200 && analyticsResponse.data?.status) {
            setAnalytics(analyticsResponse.data.data);
            console.log('✅ Analytics data loaded successfully');
          } else {
            console.warn('⚠️ Analytics response indicates failure:', analyticsResponse.data);
            toast.error('No analytics data available');
          }
        } else {
          console.error('❌ No channel ID found in response');
          toast.error('No channel found. Please create a channel first.');
        }
      } else {
        console.warn('⚠️ Channel response indicates failure:', channelResponse.data);
        toast.error('Unable to load channel data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📊 Analytics useEffect triggered, period:', selectedPeriod);
    
    if (!hasContentPremium()) {
      console.log('❌ User does not have premium access');
      setShowPremiumAlert(true);
      setLoading(false);
      return;
    }

    console.log('✅ User has premium access, loading analytics');
    if (hasContentPremium()) {
      loadAnalytics();
    }
  }, [selectedPeriod]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string;
    icon: any;
    color: string;
  }) => (
    <Card className="overflow-hidden bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
            <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        <div className="text-muted-foreground text-sm">{title}</div>
      </CardContent>
    </Card>
  );

  if (!hasContentPremium()) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
        </div>

        {/* Premium Required Message */}
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <BarChart3 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">Content Creator Premium Required</h3>
          <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
            Channel analytics are only available for content creator premium users. Upgrade to content creator premium to access detailed insights about your content performance and earnings.
          </p>
          <div className="bg-card border border-border rounded-xl p-6 mb-8 max-w-md">
            <h4 className="font-semibold text-foreground mb-2">Content Creator Premium Benefits:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Detailed earnings analytics</li>
              <li>• View and engagement metrics</li>
              <li>• Withdrawal tracking</li>
              <li>• Performance insights</li>
              <li>• Advanced creator tools</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="px-6"
            >
              Go Back
            </Button>
            <Button
              onClick={() => navigate("/chooseplan", { state: { openCreatorPacks: true } })}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-6"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border p-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <span className="ml-4 text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.id}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-card text-foreground border border-border'
              }`}
              onClick={() => setSelectedPeriod(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Total Views"
            value={formatNumber(analytics?.total_views || 0)}
            icon={Eye}
            color="blue"
          />
          <StatCard
            title="Available Balance"
            value={`₹${parseFloat(analytics?.available_balance || '0').toFixed(2)}`}
            icon={Wallet}
            color="green"
          />
          <StatCard
            title="Followers"
            value={formatNumber(analytics?.channel_followers || 0)}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Total Videos"
            value={formatNumber(analytics?.total_videos || 0)}
            icon={BarChart3}
            color="orange"
          />
        </div>

        {/* Earnings Summary */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Earnings Summary</h3>
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <div className="font-semibold text-foreground">
                  Paid Video Earnings: ₹{parseFloat(analytics?.paid_video_earned || '0').toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Withdrawn: ₹{parseFloat(analytics?.withdrawn || '0').toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Views Breakdown */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Views Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paid Views</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(analytics?.total_paid_views || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Normal Views</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(analytics?.total_normal_views || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Button */}
        {parseFloat(analytics?.available_balance || '0') > 0 && (
          <Button
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3"
            onClick={() => {
              toast.success('Withdrawal feature coming soon!');
            }}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Withdraw Earnings (₹{parseFloat(analytics?.available_balance || '0').toFixed(2)})
          </Button>
        )}
      </div>
    </div>
  );
};

export default Analytics;