import React, { useState } from 'react';
import { ShoppingCart, Edit, Trash2, Bookmark, Plus, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { apiCreateRazorpayOrder, apiVerifyRazorpayPayment } from '@/api';

// Declare Razorpay for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

const AdsCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adData } = location.state || {};

  // Load cart from localStorage on mount
  const [pendingAds, setPendingAds] = useState(() => {
    const savedCart = localStorage.getItem('adsCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [savedAds, setSavedAds] = useState(() => {
    const savedForLater = localStorage.getItem('adsSavedForLater');
    return savedForLater ? JSON.parse(savedForLater) : [];
  });

  // Save to localStorage whenever pendingAds changes
  React.useEffect(() => {
    localStorage.setItem('adsCart', JSON.stringify(pendingAds));
  }, [pendingAds]);

  // Save to localStorage whenever savedAds changes
  React.useEffect(() => {
    localStorage.setItem('adsSavedForLater', JSON.stringify(savedAds));
  }, [savedAds]);

  // Add the new ad from preview if it exists
  React.useEffect(() => {
    if (adData) {
      const newAd = {
        id: adData.adId || Date.now(),
        name: adData.contentData?.adTitle || adData.campaignData?.campaignName || 'New Campaign',
        type: adData.selectedModel?.title || 'Skip Video Ad',
        price: adData.pricing?.total || adData.campaignData?.estimatedTotalAmount || 30000,
        image: adData.uploadedFileUrl || 'https://via.placeholder.com/80x80',
        status: 'pending',
        fullData: adData // Store complete ad data for payment
      };
      
      // Check if ad already exists to avoid duplicates
      setPendingAds(prev => {
        const exists = prev.some(ad => ad.id === newAd.id);
        if (exists) {
          // Update existing ad
          return prev.map(ad => ad.id === newAd.id ? newAd : ad);
        }
        return [newAd, ...prev];
      });
    }
  }, [adData]);

  const handleEdit = (id: number) => {
    console.log('Edit ad:', id);
    // Navigate back to campaign configuration
  };

  const handleRemove = (id: number, type: 'pending' | 'saved') => {
    if (type === 'pending') {
      setPendingAds(prev => prev.filter(ad => ad.id !== id));
    } else {
      setSavedAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  const handleSaveForLater = (id: number) => {
    const ad = pendingAds.find(ad => ad.id === id);
    if (ad) {
      setSavedAds(prev => [...prev, { ...ad, status: 'saved' }]);
      setPendingAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  const handleAddToCart = (id: number) => {
    const ad = savedAds.find(ad => ad.id === id);
    if (ad) {
      setPendingAds(prev => [...prev, { ...ad, status: 'pending' }]);
      setSavedAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const totalAmount = pendingAds.reduce((sum, ad) => sum + ad.price, 0);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleProceedToPayment = async () => {
    if (pendingAds.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add campaigns to your cart before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Get user data
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const userId = userData.id || localStorage.getItem('userId') || '1';

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // Create order
      const orderData = {
        amount: totalAmount,
        currency: 'INR',
        user_id: userId
      };

      console.log('Creating Razorpay order:', orderData);
      const orderResponse = await apiCreateRazorpayOrder(orderData);

      if (!orderResponse.data?.status || !orderResponse.data?.data) {
        throw new Error(orderResponse.data?.message || 'Failed to create order');
      }

      const order = orderResponse.data.data;
      console.log('Order created:', order);

      // Get Razorpay key from environment or use default
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere';

      // Configure Razorpay options
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'AdTip',
        description: `Payment for ${pendingAds.length} advertising campaign${pendingAds.length > 1 ? 's' : ''}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...', response);
            
            // Verify payment
            const verifyData = {
              order_id: order.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: totalAmount,
              currency: 'INR',
              user_id: userId,
              payment_status: 'success',
              transaction_for: 'ad_campaign'
            };

            const verifyResponse = await apiVerifyRazorpayPayment(verifyData);

            if (verifyResponse.data?.status && verifyResponse.data?.is_verified) {
              toast({
                title: "Payment Successful!",
                description: `Your payment of ₹${totalAmount.toLocaleString()} has been processed successfully.`,
              });

              // Clear cart after successful payment
              setPendingAds([]);
              localStorage.removeItem('adsCart');

              // Navigate to orders page
              setTimeout(() => {
                navigate('/seller/ad-orders');
              }, 2000);
            } else {
              throw new Error(verifyResponse.data?.message || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support with your payment ID.",
              variant: "destructive",
            });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: userData.name || userData.username || '',
          email: userData.email || '',
          contact: userData.phone || userData.mobile || ''
        },
        theme: {
          color: '#00dcaa'
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "default",
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment processing failed. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => {
    navigate('/seller/ad-orders');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Ads Cart</h1>
                  <p className="text-white/90">Review your advertising campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Cart Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cart Summary</h2>
              <p className="text-gray-600 dark:text-gray-400">{pendingAds.length} campaigns ready for payment</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#00dcaa]">₹{totalAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
            </div>
          </div>
        </div>

        {/* Pending Ads */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ready to Launch</h2>
            <span className="bg-[#00dcaa]/10 dark:bg-[#00dcaa]/20 text-[#00dcaa] dark:text-[#00dcaa] px-3 py-1 rounded-full text-sm font-medium">
              {pendingAds.length} campaigns
            </span>
          </div>

          {pendingAds.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Add some campaigns to get started with your advertising</p>
              <button
                onClick={() => navigate('/post-ads')}
                className="bg-[#00dcaa] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00b894] transition-colors shadow-lg hover:shadow-xl"
              >
                Create New Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAds.map((ad) => (
                <div key={ad.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Campaign Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-[#00dcaa]/20 to-[#00b894]/20 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={ad.image}
                          alt={ad.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Campaign Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{ad.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ad.type}</p>
                            <div className="text-2xl font-bold text-[#00dcaa]">₹{ad.price.toLocaleString()}</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(ad.id)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#00dcaa] hover:bg-[#00dcaa]/10 rounded-lg transition-colors"
                              title="Edit campaign"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleSaveForLater(ad.id)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Save for later"
                            >
                              <Bookmark className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRemove(ad.id, 'pending')}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Remove from cart"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Proceed to Payment Button */}
              {pendingAds.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total: ₹{totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{pendingAds.length} campaign{pendingAds.length > 1 ? 's' : ''} selected</div>
                    </div>
                    <button
                      onClick={handleProceedToPayment}
                      disabled={isProcessingPayment}
                      className="bg-[#00dcaa] hover:bg-[#00b894] text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Proceed to Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Payment Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>Secure payment powered by Razorpay</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved for Later */}
        {savedAds.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Saved for Later</h2>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                {savedAds.length} campaigns
              </span>
            </div>

            <div className="space-y-4">
              {savedAds.map((ad) => (
                <div key={ad.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Campaign Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={ad.image}
                          alt={ad.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Campaign Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{ad.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ad.type}</p>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{ad.price.toLocaleString()}</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAddToCart(ad.id)}
                              className="bg-[#00dcaa] hover:bg-[#00b894] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 shadow-lg hover:shadow-xl"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </button>
                            <button
                              onClick={() => handleRemove(ad.id, 'saved')}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsCart;
