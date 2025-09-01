import React from 'react';
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Clock, DollarSign, Wallet, CreditCard, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChannelAnalyticsProps {
  analytics: {
    totalViews?: number;
    totalViewEarnings?: number;
    paidVideoEarnings?: number;
    totalPaidEarnings?: number;
    totalEarnings?: number;
    totalWithdrawn?: number;
    availableBalance?: number;
    withdrawableBalance?: number;
  } | null;
  isLoading?: boolean;
  onWithdraw?: (amount: number) => void;
  demoMode?: boolean;
}

const ChannelAnalytics: React.FC<ChannelAnalyticsProps> = ({ 
  analytics, 
  isLoading = false, 
  onWithdraw,
  demoMode = false
}) => {
  // Demo data as requested
  const demoAnalytics = {
    totalViews: 100000,
    totalViewEarnings: 1000,
    paidVideoEarnings: 10000,
    totalPaidEarnings: 12345,
    totalEarnings: 1000000,
    totalWithdrawn: 8765,
    availableBalance: 6789,
    withdrawableBalance: 2345
  };

  // Use demo data if demoMode is true, otherwise use provided analytics
  const displayAnalytics = demoMode ? demoAnalytics : analytics;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!displayAnalytics) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No analytics data available</p>
        <p className="text-sm">Start creating content to see your channel analytics</p>
      </div>
    );
  }

  const {
    totalViews = 0,
    totalViewEarnings = 0,
    paidVideoEarnings = 0,
    totalPaidEarnings = 0,
    totalEarnings = 0,
    totalWithdrawn = 0,
    availableBalance = 0,
    withdrawableBalance = 0
  } = displayAnalytics;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
  };

  const handleWithdraw = () => {
    if (onWithdraw && withdrawableBalance > 0) {
      onWithdraw(withdrawableBalance);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      {demoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M13 18a5 5 0 01-10 0V8a5 5 0 0110 0v10zM6 8a4 4 0 118 0v10a4 4 0 11-8 0V8z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This is a demonstration of the Channel Analytics component with sample data.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Channel Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalViews)}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalPaidEarnings)}</div>
            <div className="text-sm text-gray-600">Paid Earnings</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Wallet className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(availableBalance)}</div>
            <div className="text-sm text-gray-600">Available Balance</div>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">View-Based Earnings</h4>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalViewEarnings)}</div>
            <p className="text-sm text-blue-700 mt-1">
              Earnings from video views and engagement
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Paid Video Earnings</h4>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidVideoEarnings)}</div>
            <p className="text-sm text-green-700 mt-1">
              Earnings from premium/paid video content
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Total Earnings</span>
            </div>
            <span className="text-lg font-bold text-green-600">{formatCurrency(totalEarnings)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium">Total Withdrawn</span>
            </div>
            <span className="text-lg font-bold text-red-600">{formatCurrency(totalWithdrawn)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Available Balance</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(availableBalance)}</span>
          </div>
        </div>
      </div>

      {/* Withdraw Funds */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-green-800">Available for Withdrawal</h4>
              <p className="text-sm text-green-600">Your withdrawable balance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(withdrawableBalance)}</div>
              <div className="text-sm text-green-500">Ready to withdraw</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>• Minimum withdrawal: ₹100</p>
              <p>• Processing time: 2-5 business days</p>
            </div>
            
            <Button
              onClick={handleWithdraw}
              disabled={withdrawableBalance <= 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              {withdrawableBalance > 0 ? 'Withdraw Funds' : 'No Funds Available'}
            </Button>
          </div>
        </div>
        
        {withdrawableBalance > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Withdrawal Information</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• Funds will be transferred to your registered bank account</p>
                  <p>• Please ensure your bank details are up to date</p>
                  <p>• Contact support if you have any questions</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Earnings per View</h4>
            <div className="text-2xl font-bold text-blue-600">
              {totalViews > 0 ? (totalViewEarnings / totalViews).toFixed(4) : 0}
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Average earnings per video view
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Withdrawal Rate</h4>
            <div className="text-2xl font-bold text-green-600">
              {totalEarnings > 0 ? ((totalWithdrawn / totalEarnings) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-green-700 mt-1">
              Percentage of earnings withdrawn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelAnalytics;
