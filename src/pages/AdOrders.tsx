import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Download, MoreVertical, Eye, BarChart3, Pause, Play, Target, TrendingUp, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  apiGetUserAds, 
  apiGetFilteredAds, 
  apiGetMasterAdsPagination,
  apiSaveAdPauseContinueStatus 
} from '@/api';
import { toast } from '@/hooks/use-toast';

const AdOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [adOrders, setAdOrders] = useState<any[]>([]);

  // Fetch user's ads on component mount
  useEffect(() => {
    fetchUserAds();
  }, [currentPage]);

  const fetchUserAds = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;

      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your ad campaigns.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Fetch user's ads
      const response = await apiGetUserAds(userId.toString());
      
      if (response.data && response.data.status === 200) {
        const ads = response.data.data || [];
        setAdOrders(ads);
      } else {
        setAdOrders([]);
      }
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load your ad campaigns.",
        variant: "destructive",
      });
      // Set mock data as fallback for development
      setAdOrders(mockAdOrders);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdStatus = async (adId: string, currentStatus: string) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;

      const newStatus = currentStatus === 'Running' || currentStatus === 'Active' ? 'Paused' : 'Running';
      
      await apiSaveAdPauseContinueStatus({
        id: adId,
        userId: userId,
        status: newStatus
      });

      toast({
        title: "Success",
        description: `Campaign ${newStatus.toLowerCase()} successfully.`,
      });

      // Refresh ads list
      fetchUserAds();
    } catch (error: any) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign status.",
        variant: "destructive",
      });
    }
  };

  // Mock data for development/fallback
  const mockAdOrders = [
    {
      id: 'CAM001',
      campaignName: 'Tech Innovation Campaign',
      adType: 'Skip Video Ad',
      status: 'Running',
      budget: 30000,
      spent: 18500,
      impressions: 2300000,
      clicks: 45200,
      conversions: 850,
      ctr: 1.97,
      createdDate: '1/15/2024',
      endDate: '2/14/2024',
      audience: 'Age 18-35, Fashion Interest',
      platform: ['YouTube', 'Instagram'],
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
    },
    {
      id: 'CAM002',
      campaignName: 'Fashion Summer Sale',
      adType: 'Banner Ads',
      status: 'Completed',
      budget: 15000,
      spent: 15000,
      impressions: 1800000,
      clicks: 32100,
      conversions: 567,
      ctr: 1.78,
      createdDate: '1/1/2024',
      endDate: '1/15/2024',
      audience: 'Age 25-45, Tech Interest',
      platform: ['Google', 'Facebook'],
      thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
    },
    {
      id: 'CAM003',
      campaignName: 'Food Delivery Promo',
      adType: 'QR Code Video Ads',
      status: 'Paused',
      budget: 25000,
      spent: 12800,
      impressions: 1200000,
      clicks: 28500,
      conversions: 678,
      ctr: 2.38,
      createdDate: '1/10/2024',
      endDate: '1/30/2024',
      audience: 'Age 20-50, All Interests',
      platform: ['YouTube', 'Facebook', 'Instagram'],
      thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
    },
    {
      id: 'CAM004',
      campaignName: 'Holiday Special Promotion',
      adType: 'Interactive Ad',
      status: 'Under Review',
      budget: 12000,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      createdDate: '1/20/2024',
      endDate: '2/20/2024',
      audience: 'Age 18-60, Shopping Interest',
      platform: ['Google', 'Instagram'],
      thumbnail: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=300&fit=crop'
    },
    {
      id: 'CAM005',
      campaignName: 'Fitness App Launch',
      adType: 'Skip Video Ad',
      status: 'Running',
      budget: 18000,
      spent: 7200,
      impressions: 980000,
      clicks: 19600,
      conversions: 324,
      ctr: 2.0,
      createdDate: '1/25/2024',
      endDate: '2/25/2024',
      audience: 'Age 22-40, Fitness Interest',
      platform: ['YouTube', 'TikTok'],
      thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
    },
    {
      id: 'CAM006',
      campaignName: 'E-commerce Flash Sale',
      adType: 'Banner Ads',
      status: 'Completed',
      budget: 22000,
      spent: 21500,
      impressions: 2100000,
      clicks: 42000,
      conversions: 1260,
      ctr: 2.0,
      createdDate: '12/15/2023',
      endDate: '1/5/2024',
      audience: 'Age 25-50, Shopping Interest',
      platform: ['Google', 'Facebook', 'Instagram'],
      thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Under Review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Running':
        return <Play className="w-4 h-4" />;
      case 'Paused':
        return <Pause className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Under Review':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const filteredOrders = adOrders.filter(order => {
    const matchesSearch = order.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && (order.status === 'Active' || order.status === 'Running');
    if (activeTab === 'paused') return matchesSearch && order.status === 'Paused';
    if (activeTab === 'completed') return matchesSearch && order.status === 'Completed';
    
    return matchesSearch;
  });

  const handleBack = () => {
    navigate('/seller/dashboard');
  };

  const totalBudget = adOrders.reduce((sum, order) => sum + order.budget, 0);
  const totalSpent = adOrders.reduce((sum, order) => sum + order.spent, 0);
  const totalImpressions = adOrders.reduce((sum, order) => sum + order.impressions, 0);
  const totalClicks = adOrders.reduce((sum, order) => sum + order.clicks, 0);
  const totalConversions = adOrders.reduce((sum, order) => sum + order.conversions, 0);
  const averageCTR = adOrders.length > 0 ? (adOrders.reduce((sum, order) => sum + order.ctr, 0) / adOrders.length) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-card/20 rounded-lg transition-colors"
                title="Go back to dashboard"
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold mb-2">Ad Orders</h1>
                <p className="text-white/90">Manage and track your advertising campaigns</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-card/20 hover:bg-card/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Report</span>
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-3 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown and Ad Cart Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/seller/ads-cart')}
              className="bg-[#00dcaa] hover:bg-[#00b894] text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Ad Cart</span>
            </button>
            <select 
              value={activeTab} 
              onChange={(e) => setActiveTab(e.target.value)}
              className="px-4 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Running</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Campaign Image */}
              <div className="relative h-48 bg-gradient-to-br from-[#00dcaa]/10 to-[#00b894]/10">
                <img
                  src="https://via.placeholder.com/400x300/00dcaa/ffffff?text=Campaign+Image"
                  alt={order.campaignName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
                {/* Campaign Type Badge */}
                <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {order.adType}
                </div>
              </div>

              {/* Campaign Details */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-[#00dcaa] transition-colors">
                    {order.campaignName}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>ID: {order.id}</span>
                    <span>{order.createdDate}</span>
                  </div>
                </div>

                {/* Budget Information */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-[#00dcaa]">₹{order.budget.toLocaleString()}</span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Budget Used</div>
                      <div className="text-xs text-muted-foreground">₹{order.spent.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-1">
                    <div 
                      className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((order.spent / order.budget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {Math.round((order.spent / order.budget) * 100)}% utilized
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm font-bold text-foreground">{(order.impressions / 1000).toFixed(1)}K</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm font-bold text-foreground">{(order.clicks / 1000).toFixed(1)}K</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm font-bold text-foreground">{order.ctr}%</div>
                    <div className="text-xs text-muted-foreground">CTR</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => navigate(`/seller/ad-analytics/${order.id}`, { state: { order } })}
                    className="flex-1 bg-[#00dcaa]/10 text-[#00dcaa] py-2 px-3 rounded-lg text-sm font-medium hover:bg-[#00dcaa] hover:text-white transition-all flex items-center justify-center space-x-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Track</span>
                  </button>
                  <button 
                    onClick={() => alert('Preview functionality coming soon')}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                </div>

                <div className="flex space-x-2 mt-2">
                  <button 
                    onClick={() => alert('Download functionality coming soon')}
                    className="flex-1 bg-muted text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-600 hover:text-white transition-all flex items-center justify-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button 
                    onClick={() => alert('Share functionality coming soon')}
                    className="flex-1 bg-muted text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-600 hover:text-white transition-all flex items-center justify-center space-x-1"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No ad orders found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'Create your first advertising campaign to see orders here'}
            </p>
            <button
              onClick={() => navigate('/post-ads')}
              className="bg-[#00dcaa] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00b894] transition-colors"
            >
              Create New Campaign
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {adOrders.length} orders
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">
                Previous
              </button>
              <div className="flex items-center space-x-1">
                <button className="px-3 py-2 bg-[#00dcaa] text-white rounded-lg text-sm font-medium">1</button>
                <button className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">2</button>
                <button className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">3</button>
              </div>
              <button className="px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdOrders;
