import React from 'react';
import { ArrowLeft, TrendingUp, Users, MousePointer, Eye, Calendar, Target, DollarSign } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const AdAnalytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { order } = location.state || {};

  const handleBack = () => {
    navigate('/seller/ad-orders');
  };

  // Mock analytics data
  const analyticsData = {
    totalSpent: order?.spent || 18500,
    totalBudget: order?.budget || 30000,
    impressions: order?.impressions || 2300000,
    clicks: order?.clicks || 45200,
    conversions: order?.conversions || 850,
    ctr: order?.ctr || 1.97,
    conversionRate: ((order?.conversions || 850) / (order?.clicks || 45200) * 100).toFixed(2),
    costPerClick: ((order?.spent || 18500) / (order?.clicks || 45200)).toFixed(2),
    weeklyData: [
      { day: 'Mon', impressions: 320000, clicks: 6400, conversions: 120 },
      { day: 'Tue', impressions: 350000, clicks: 7000, conversions: 140 },
      { day: 'Wed', impressions: 380000, clicks: 7600, conversions: 150 },
      { day: 'Thu', impressions: 400000, clicks: 8000, conversions: 160 },
      { day: 'Fri', impressions: 360000, clicks: 7200, conversions: 135 },
      { day: 'Sat', impressions: 290000, clicks: 5800, conversions: 95 },
      { day: 'Sun', impressions: 200000, clicks: 4000, conversions: 50 }
    ]
  };

  return (
    <div className="min-h-screen bg-[#f5f5ff] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] dark:from-teal-700 dark:to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Go back to ad orders"
                aria-label="Go back to ad orders"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold mb-2">Campaign Analytics</h1>
                <p className="text-white/90">{order?.campaignName || 'Campaign Performance Dashboard'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold">₹{analyticsData.totalSpent.toLocaleString()}</div>
                <div className="text-white/80 text-sm">of ₹{analyticsData.totalBudget.toLocaleString()} spent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+12.5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(analyticsData.impressions / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-600 text-sm">Total Impressions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MousePointer className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+8.3%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(analyticsData.clicks / 1000).toFixed(1)}K
            </div>
            <div className="text-gray-600 text-sm">Total Clicks</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+15.2%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.conversions}
            </div>
            <div className="text-gray-600 text-sm">Conversions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-red-500 text-sm font-medium">+2.1%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ₹{analyticsData.costPerClick}
            </div>
            <div className="text-gray-600 text-sm">Cost Per Click</div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Performance</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#00dcaa] rounded-full"></div>
                <span className="text-sm text-gray-600">Impressions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Clicks</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Conversions</span>
              </div>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between space-x-2 h-64">
            {analyticsData.weeklyData.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center space-y-1 mb-2">
                  {/* Impressions Bar */}
                  <div 
                    className="w-full bg-[#00dcaa] rounded-t"
                    style={{ height: `${(day.impressions / 400000) * 120}px` }}
                    title={`Impressions: ${day.impressions.toLocaleString()}`}
                  ></div>
                  {/* Clicks Bar */}
                  <div 
                    className="w-full bg-blue-500 rounded"
                    style={{ height: `${(day.clicks / 8000) * 80}px` }}
                    title={`Clicks: ${day.clicks.toLocaleString()}`}
                  ></div>
                  {/* Conversions Bar */}
                  <div 
                    className="w-full bg-purple-500 rounded-b"
                    style={{ height: `${(day.conversions / 160) * 40}px` }}
                    title={`Conversions: ${day.conversions}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Click-through Rate (CTR)</span>
                <span className="font-semibold text-[#00dcaa]">{analyticsData.ctr}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-[#00dcaa]">{analyticsData.conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Budget Utilization</span>
                <span className="font-semibold text-[#00dcaa]">
                  {Math.round((analyticsData.totalSpent / analyticsData.totalBudget) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cost Per Conversion</span>
                <span className="font-semibold text-[#00dcaa]">
                  ₹{(analyticsData.totalSpent / analyticsData.conversions).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Campaign ID</span>
                <span className="font-semibold">{order?.id || id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ad Type</span>
                <span className="font-semibold">{order?.adType || 'Skip Video Ad'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order?.status === 'Running' ? 'bg-green-100 text-green-800' :
                  order?.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  order?.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order?.status || 'Running'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Start Date</span>
                <span className="font-semibold">{order?.createdDate || '1/15/2024'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdAnalytics;