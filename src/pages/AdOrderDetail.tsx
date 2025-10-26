import { useState } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Users, Eye, MousePointer, Calendar, MapPin, Play, Pause, Edit, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdOrderDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { order } = location.state || {};

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f5f5ff] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/seller/ad-orders')}
            className="bg-[#00dcaa] text-white px-6 py-3 rounded-lg hover:bg-[#00b894] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Paused':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Completed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Under Review':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/seller/ad-orders')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Back to orders"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold mb-2">{order.campaignName}</h1>
                <p className="text-white/90">Campaign ID: {order.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border font-medium ${getStatusColor(order.status)}`}>
                <span>{order.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{order.impressions?.toLocaleString()}</div>
            <div className="text-gray-600 text-sm">Impressions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{order.clicks?.toLocaleString()}</div>
            <div className="text-gray-600 text-sm">Clicks</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{order.ctr}%</div>
            <div className="text-gray-600 text-sm">CTR</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{order.conversions}</div>
            <div className="text-gray-600 text-sm">Conversions</div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Campaign Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Campaign Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Ad Type</label>
                  <p className="text-gray-900 font-medium mt-1">{order.adType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Target Audience</label>
                  <p className="text-gray-900 font-medium mt-1">{order.audience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900 font-medium mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {order.createdDate}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900 font-medium mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {order.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Performance chart would be here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Budget */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-[#00dcaa] text-white py-3 px-4 rounded-lg hover:bg-[#00b894] transition-colors flex items-center justify-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit Campaign</span>
                </button>
                
                {order.status === 'Active' ? (
                  <button className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2">
                    <Pause className="w-4 h-4" />
                    <span>Pause Campaign</span>
                  </button>
                ) : (
                  <button className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Resume Campaign</span>
                  </button>
                )}
                
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>

            {/* Budget Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget & Spend</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Budget</span>
                    <span className="text-lg font-bold text-gray-900">₹{order.budget?.toLocaleString()}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Amount Spent</span>
                    <span className="text-lg font-bold text-[#00dcaa]">₹{order.spent?.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-[#00dcaa] h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((order.spent / order.budget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{((order.spent / order.budget) * 100).toFixed(1)}% used</span>
                    <span>₹{(order.budget - order.spent).toLocaleString()} remaining</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platforms</h3>
              <div className="space-y-2">
                {order.platform?.map((platform: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{platform.charAt(0)}</span>
                    </div>
                    <span className="text-gray-900 font-medium">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdOrderDetail;