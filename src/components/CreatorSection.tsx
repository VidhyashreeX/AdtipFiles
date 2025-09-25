import React from 'react';
import { Upload, BarChart3, DollarSign, Shield, Calendar, X } from 'lucide-react';

const CreatorSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Content Creator Services</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Premium Uploads */}
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-[#f5f5ff] rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-[#00dcaa]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Premium Uploads</h3>
                <p className="text-gray-600">Enhanced content delivery and management</p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#00dcaa] rounded-full"></div>
                <span className="text-gray-700">Unlimited file uploads</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#00dcaa] rounded-full"></div>
                <span className="text-gray-700">Priority processing</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#00dcaa] rounded-full"></div>
                <span className="text-gray-700">Advanced scheduling</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#00dcaa] rounded-full"></div>
                <span className="text-gray-700">HD/4K support</span>
              </li>
            </ul>
            
            <button className="w-full bg-[#00dcaa] text-white py-3 rounded-lg hover:bg-[#00b894] transition-colors font-medium">
              Upgrade to Premium
            </button>
          </div>
        </div>

        {/* Order Management */}
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-[#f5f5ff] rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#00dcaa]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Order Management</h3>
                <p className="text-gray-600">Complete order lifecycle management</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-[#f5f5ff] rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Campaign #1234</p>
                  <p className="text-sm text-gray-600">Active • $299</p>
                </div>
                <button className="text-red-500 hover:text-red-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#f5f5ff] rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Campaign #1235</p>
                  <p className="text-sm text-gray-600">Pending • $149</p>
                </div>
                <button className="text-red-500 hover:text-red-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#00dcaa] text-white py-2 px-4 rounded-lg hover:bg-[#00b894] transition-colors text-sm font-medium">
                New Order
              </button>
              <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 border border-gray-200 rounded-lg">
          <BarChart3 className="w-8 h-8 text-[#00dcaa] mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
          <p className="text-sm text-gray-600">Track performance and engagement metrics</p>
        </div>
        
        <div className="text-center p-4 border border-gray-200 rounded-lg">
          <DollarSign className="w-8 h-8 text-[#00dcaa] mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Revenue Tracking</h4>
          <p className="text-sm text-gray-600">Monitor earnings and payment history</p>
        </div>
        
        <div className="text-center p-4 border border-gray-200 rounded-lg">
          <Shield className="w-8 h-8 text-[#00dcaa] mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Secure Platform</h4>
          <p className="text-sm text-gray-600">Enterprise-grade security and privacy</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorSection;