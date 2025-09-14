import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  DollarSign,
  Calendar,
  Video,
  Play
} from 'lucide-react';

interface EarningsData {
  totalEarnings: number;
  withdrawableAmount: number;
  subscribersCount: number;
  contentCounts: {
    posts: number;
    videos: number;
    shorts: number;
  };
  contentItems: any[];
}

interface SimplifiedChannelAnalyticsProps {
  channelId: string;
  onDataUpdate: (data: EarningsData) => void;
  onLoadingStart: () => void;
}

const SimplifiedChannelAnalytics: React.FC<SimplifiedChannelAnalyticsProps> = ({
  channelId,
  onDataUpdate,
  onLoadingStart
}) => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channelId) {
      fetchAnalyticsData();
    }
  }, [channelId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      onLoadingStart();
      setError(null);

      // Import analyticsService dynamically to avoid circular dependencies
      const { analyticsService } = await import('@/services/analyticsService');
      
      const data = await analyticsService.getChannelEarnings(channelId);
      
      if (data) {
        setEarningsData(data);
        onDataUpdate(data);
      } else {
        setError('No analytics data available');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Channel Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Channel Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalyticsData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earningsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-teal-700">
                {formatCurrency(earningsData.totalEarnings)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Withdrawable</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(earningsData.withdrawableAmount)}
              </p>
            </div>
          </div>
          
          {earningsData.withdrawableAmount > 0 && (
            <div className="mt-4 flex justify-center">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white w-full md:w-auto px-6 py-2 text-sm md:text-base">
                Withdraw Funds
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Channel Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <p className="text-lg font-semibold">{formatNumber(earningsData.subscribersCount)}</p>
              <p className="text-xs text-gray-600">Subscribers</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Video className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <p className="text-lg font-semibold">{earningsData.contentCounts.posts}</p>
              <p className="text-xs text-gray-600">Posts</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Play className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <p className="text-lg font-semibold">{earningsData.contentCounts.videos}</p>
              <p className="text-xs text-gray-600">Videos</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <p className="text-lg font-semibold">{earningsData.contentCounts.shorts}</p>
              <p className="text-xs text-gray-600">Shorts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Performance */}
      {/* {earningsData.contentItems && earningsData.contentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Recent Content Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earningsData.contentItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      {item.type === 'video' ? (
                        <Play className="h-6 w-6 text-teal-600" />
                      ) : (
                        <Video className="h-6 w-6 text-teal-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-48">
                        {item.title || `Content ${index + 1}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(item.views || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatNumber(item.likes || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {formatNumber(item.comments || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.isPaid && (
                      <Badge className="bg-teal-100 text-teal-800 mb-1">
                        Paid
                      </Badge>
                    )}
                    <p className="text-sm font-medium text-teal-600">
                      {formatCurrency(item.earnings || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
};

export default SimplifiedChannelAnalytics;
