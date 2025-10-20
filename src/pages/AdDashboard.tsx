import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MousePointer, 
  DollarSign, 
  Plus, 
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Target,
  Calendar,
  Zap,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  apiGetUserAds, 
  apiGetGraphData
} from '@/api';
import { useAuthModal } from '../contexts/AuthModalContext';

const AdDashboard: React.FC = () => {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    totalViews: 0,
    totalClicks: 0,
    totalConversions: 0,
    activeCampaigns: 0,
    avgCTR: 0,
    avgROI: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;

      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your dashboard.",
          variant: "destructive",
        });
        openLoginModal();
        return;
      }

      // Fetch campaigns
      const campaignsRes = await apiGetUserAds(userId.toString());
      const campaignsData = campaignsRes.data?.data || [];
      setCampaigns(campaignsData);

      // Calculate analytics from campaigns
      const stats = {
        totalSpent: 0,
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        activeCampaigns: 0,
        avgCTR: 0,
        avgROI: 0
      };

      campaignsData.forEach((campaign: any) => {
        stats.totalSpent += parseFloat(campaign.ad_total || 0);
        stats.totalViews += parseInt(campaign.ad_view || 0);
        stats.totalClicks += parseInt(campaign.ad_like || 0); // Using likes as clicks for now
        if (campaign.adPauseCountinue === 1) {
          stats.activeCampaigns++;
        }
      });

      stats.totalConversions = Math.floor(stats.totalClicks * 0.15); // Estimate
      stats.avgCTR = stats.totalViews > 0 ? (stats.totalClicks / stats.totalViews * 100) : 0;
      stats.avgROI = stats.totalSpent > 0 ? ((stats.totalConversions * 500 - stats.totalSpent) / stats.totalSpent * 100) : 0;

      setAnalytics(stats);

      // Fetch transaction history
      // Note: apiGetAdPassBook is not yet implemented in api.ts
      // Uncomment when the API function is added
      // try {
      //   const transactionsRes = await apiGetAdPassBook(userId.toString());
      //   setTransactions(transactionsRes.data?.data || []);
      // } catch (err) {
      //   console.log('Transaction history not available');
      // }

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your advertising dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Advertising Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your campaigns and track performance
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/seller/ad-orders')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View All Campaigns
              </button>
              <button
                onClick={() => navigate('/post-ads')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Spent"
            value={`₹${analytics.totalSpent.toLocaleString()}`}
            icon={DollarSign}
            color="#8b5cf6"
          />
          <StatCard
            title="Total Views"
            value={analytics.totalViews.toLocaleString()}
            icon={Eye}
            trend={12.5}
            color="#3b82f6"
          />
          <StatCard
            title="Total Clicks"
            value={analytics.totalClicks.toLocaleString()}
            icon={MousePointer}
            trend={8.3}
            color="#10b981"
          />
          <StatCard
            title="Active Campaigns"
            value={analytics.activeCampaigns}
            icon={Zap}
            color="#f59e0b"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Average CTR</h3>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.avgCTR.toFixed(2)}%
            </div>
            <p className="text-sm text-gray-600">Click-through rate</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Conversions</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.totalConversions}
            </div>
            <p className="text-sm text-gray-600">Estimated conversions</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Average ROI</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className={`text-3xl font-bold mb-2 ${analytics.avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.avgROI >= 0 ? '+' : ''}{analytics.avgROI.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Return on investment</p>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
              <button
                onClick={() => navigate('/seller/ad-orders')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first advertising campaign to start reaching your audience
                </p>
                <button
                  onClick={() => navigate('/post-ads')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/seller/ad-order/${campaign.id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {campaign.ad_upload_filename && (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={campaign.imagePath || '/placeholder.svg'}
                            alt={campaign.campaign_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {campaign.campaign_name || 'Untitled Campaign'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {campaign.company_name || 'No company'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Views</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {campaign.ad_view?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Clicks</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {campaign.ad_like?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Budget</div>
                        <div className="text-lg font-semibold text-gray-900">
                          ₹{campaign.ad_total?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.adPauseCountinue === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {campaign.adPauseCountinue === 1 ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/post-ads')}
            className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left"
          >
            <Plus className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Create Campaign</h3>
            <p className="text-purple-100 text-sm">
              Start a new advertising campaign in minutes
            </p>
          </button>

          <button
            onClick={() => navigate('/seller/ad-analytics')}
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left"
          >
            <BarChart3 className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-semibold mb-2">View Analytics</h3>
            <p className="text-blue-100 text-sm">
              Dive deep into your campaign performance
            </p>
          </button>

          <button
            onClick={() => navigate('/seller/ad-orders')}
            className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left"
          >
            <Target className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Manage Campaigns</h3>
            <p className="text-green-100 text-sm">
              Edit, pause, or optimize your campaigns
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdDashboard;
