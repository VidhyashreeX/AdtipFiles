import React, { useState } from 'react';
import { ShoppingCart, Edit, Trash2, Bookmark, Plus, ArrowLeft, CreditCard, Loader2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { apiCreateRazorpayOrder, apiVerifyRazorpayPayment } from '@/api';
import Select from 'react-select';

// Declare Razorpay for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Custom styles for react-select with dark mode
const getSelectStyles = (isDark: boolean) => ({
  control: (base: any) => ({
    ...base,
    minHeight: '48px',
    borderRadius: '12px',
    border: 'none',
    boxShadow: 'none',
    background: isDark 
      ? 'linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))' 
      : 'linear-gradient(to right, rgb(249, 250, 251), rgb(243, 244, 246))',
    '&:hover': {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused 
      ? (isDark ? 'rgba(0, 220, 170, 0.2)' : 'rgba(0, 220, 170, 0.1)')
      : 'transparent',
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: isDark ? 'rgba(0, 220, 170, 0.3)' : 'rgba(0, 220, 170, 0.2)',
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
  }),
  input: (base: any) => ({
    ...base,
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
  }),
});

const AdsCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adData } = location.state || {};

  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

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

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    campaignName: '',
    campaignDescription: '',
    adTitle: '',
    adDescription: '',
    callToAction: '',
    amountPerCustomer: '',
    customersPerDay: '',
    campaignDuration: '',
    targetGender: '',
    targetAge: '',
    targetMaritalStatus: '',
    targetProfession: '',
    targetAreas: {
      delhi: false,
      mumbai: false,
      chennai: false,
      bangalore: false,
      hyderabad: false,
      kolkata: false
    },
    customLocation: '',
    startDateTime: null as Date | null,
    endDateTime: null as Date | null
  });

  const handleEdit = (id: number) => {
    const ad = pendingAds.find(ad => ad.id === id);
    if (!ad || !ad.fullData) {
      toast({
        title: "Error",
        description: "Ad data not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Populate form data from ad
    const fullData = ad.fullData;
    setEditFormData({
      campaignName: fullData.campaignData?.campaignName || '',
      campaignDescription: fullData.campaignData?.campaignDescription || '',
      adTitle: fullData.contentData?.adTitle || '',
      adDescription: fullData.contentData?.adDescription || '',
      callToAction: fullData.contentData?.callToAction || '',
      amountPerCustomer: fullData.campaignData?.amountPerCustomer || '',
      customersPerDay: fullData.campaignData?.customersPerDay || '',
      campaignDuration: fullData.campaignData?.campaignDuration || '',
      targetGender: fullData.campaignData?.targetGender || '',
      targetAge: fullData.campaignData?.targetAge || '',
      targetMaritalStatus: fullData.campaignData?.targetMaritalStatus || '',
      targetProfession: fullData.campaignData?.targetProfession || '',
      targetAreas: fullData.campaignData?.targetAreas || {
        delhi: false,
        mumbai: false,
        chennai: false,
        bangalore: false,
        hyderabad: false,
        kolkata: false
      },
      customLocation: fullData.campaignData?.customLocation || '',
      startDateTime: fullData.campaignData?.startDateTime ? new Date(fullData.campaignData.startDateTime) : null,
      endDateTime: fullData.campaignData?.endDateTime ? new Date(fullData.campaignData.endDateTime) : null
    });

    setEditingAd(ad);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedAd = () => {
    if (!editingAd) return;

    // Recalculate pricing
    const amountPerCustomer = parseFloat(editFormData.amountPerCustomer) || 0;
    const customersPerDay = parseFloat(editFormData.customersPerDay) || 0;
    const campaignDuration = parseFloat(editFormData.campaignDuration) || 0;
    const baseAmount = amountPerCustomer * customersPerDay * campaignDuration;
    
    // Calculate total with tax (18% GST)
    const taxRate = 0.18;
    const taxAmount = baseAmount * taxRate;
    const totalAmount = baseAmount + taxAmount;

    // Update the ad in the cart
    const updatedAd = {
      ...editingAd,
      name: editFormData.adTitle || editFormData.campaignName,
      price: totalAmount, // Use total amount including tax
      fullData: {
        ...editingAd.fullData,
        campaignData: {
          ...editingAd.fullData.campaignData,
          campaignName: editFormData.campaignName,
          campaignDescription: editFormData.campaignDescription,
          amountPerCustomer: editFormData.amountPerCustomer,
          customersPerDay: editFormData.customersPerDay,
          campaignDuration: editFormData.campaignDuration,
          estimatedTotalAmount: baseAmount.toString(), // Store base amount here
          targetGender: editFormData.targetGender,
          targetAge: editFormData.targetAge,
          targetMaritalStatus: editFormData.targetMaritalStatus,
          targetProfession: editFormData.targetProfession,
          targetAreas: editFormData.targetAreas,
          customLocation: editFormData.customLocation,
          startDateTime: editFormData.startDateTime,
          endDateTime: editFormData.endDateTime
        },
        contentData: {
          ...editingAd.fullData.contentData,
          adTitle: editFormData.adTitle,
          adDescription: editFormData.adDescription,
          callToAction: editFormData.callToAction
        },
        pricing: {
          orderValue: baseAmount,
          tax: taxAmount,
          total: totalAmount
        }
      }
    };

    setPendingAds(prev => prev.map(ad => ad.id === editingAd.id ? updatedAd : ad));
    
    toast({
      title: "Success",
      description: "Ad updated successfully!",
    });

    setIsEditModalOpen(false);
    setEditingAd(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAd(null);
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

  const totalAmount = pendingAds.reduce((sum, ad) => sum + (typeof ad.price === 'number' ? ad.price : parseFloat(ad.price || '0')), 0);

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
      // Backend expects amount in rupees
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
        amount: Math.round(order.amount * 100), // Convert rupees to paise for Razorpay SDK
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

  // Proceed to payment for a single ad
  const handleProceedToPaymentForAd = async (ad: any) => {
    if (!ad) return;

    setIsProcessingPayment(true);

    try {
      const userData = JSON.parse(localStorage.getItem('UserData') || '{}');
      const userId = userData.id || localStorage.getItem('userId') || '1';

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay SDK');

      // derive price components
      const pricing = ad.fullData?.pricing || {};
      const total = pricing.total || ad.price || 0;
      const totalNum = typeof total === 'number' ? total : parseFloat(total || '0');

      const orderData = {
        amount: totalNum, // Send in rupees, not paise
        currency: 'INR',
        user_id: userId,
        ad_id: ad.id
      };

      console.log('Creating Razorpay order for ad:', orderData);
      const orderResponse = await apiCreateRazorpayOrder(orderData);

      if (!orderResponse.data?.status || !orderResponse.data?.data) {
        throw new Error(orderResponse.data?.message || 'Failed to create order');
      }

      const order = orderResponse.data.data;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere';

      const options = {
        key: razorpayKey,
        amount: Math.round(order.amount * 100), // Convert rupees to paise for Razorpay SDK
        currency: order.currency || 'INR',
        name: 'AdTip',
        description: `Payment for ${ad.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyData = {
              order_id: order.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: totalNum,
              currency: 'INR',
              user_id: userId,
              payment_status: 'success',
              transaction_for: 'ad_campaign',
              ad_id: ad.id
            };

            const verifyResponse = await apiVerifyRazorpayPayment(verifyData);
            if (verifyResponse.data?.status && verifyResponse.data?.is_verified) {
              toast({ title: 'Payment Successful!', description: `₹${totalNum.toLocaleString()} processed.` });
              // remove paid ad from cart
              setPendingAds(prev => prev.filter(a => a.id !== ad.id));
              localStorage.setItem('adsCart', JSON.stringify(pendingAds.filter(a => a.id !== ad.id)));
            } else {
              throw new Error(verifyResponse.data?.message || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({ title: 'Payment Verification Failed', description: error.message || 'Please contact support.', variant: 'destructive' });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: userData.name || userData.username || '',
          email: userData.email || '',
          contact: userData.phone || userData.mobile || ''
        },
        theme: { color: '#00dcaa' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        toast({ title: 'Payment Failed', description: response.error?.description || 'Try again.', variant: 'destructive' });
        setIsProcessingPayment(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({ title: 'Payment Error', description: error.message || 'Failed to initiate payment.', variant: 'destructive' });
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

                            {/* Price breakdown (try to read detailed pricing from ad.fullData.pricing) */}
                            {(() => {
                              const pricing = ad.fullData?.pricing || {};
                              const total = pricing.total ?? ad.price ?? 0;
                              const totalNum = typeof total === 'number' ? total : parseFloat(total || '0');
                              const orderValue = pricing.orderValue !== undefined ? (typeof pricing.orderValue === 'number' ? pricing.orderValue : parseFloat(pricing.orderValue || '0')) : parseFloat((totalNum / 1.18).toFixed(2));
                              const taxAmount = pricing.tax !== undefined ? (typeof pricing.tax === 'number' ? pricing.tax : parseFloat(pricing.tax || '0')) : parseFloat((totalNum - orderValue).toFixed(2));

                              return (
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Base: ₹{orderValue.toFixed(2)}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Tax (18%): ₹{taxAmount.toFixed(2)}</div>
                                  <div className="text-2xl font-bold text-[#00dcaa] mt-1">₹{totalNum.toFixed(2)}</div>
                                </div>
                              );
                            })()}
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

                            {/* Pay Now for single ad */}
                            <button
                              onClick={() => handleProceedToPaymentForAd(ad)}
                              className="bg-[#00dcaa] hover:bg-[#00b894] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-2"
                              title="Pay for this campaign"
                            >
                              Pay Now
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

      {/* Edit Ad Modal */}
      {isEditModalOpen && editingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Ad Campaign</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.campaignName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.adTitle}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, adTitle: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Description
                </label>
                <textarea
                  value={editFormData.campaignDescription}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, campaignDescription: e.target.value }))}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ad Description
                </label>
                <textarea
                  value={editFormData.adDescription}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, adDescription: e.target.value }))}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Call to Action
                </label>
                <input
                  type="text"
                  value={editFormData.callToAction}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, callToAction: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Pricing Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount per Customer (₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.amountPerCustomer}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, amountPerCustomer: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customers per Day
                  </label>
                  <input
                    type="number"
                    value={editFormData.customersPerDay}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, customersPerDay: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={editFormData.campaignDuration}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, campaignDuration: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Targeting Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Gender
                  </label>
                  <Select
                    value={editFormData.targetGender ? { value: editFormData.targetGender, label: editFormData.targetGender } : null}
                    onChange={(option) => setEditFormData(prev => ({ ...prev, targetGender: option?.value || '' }))}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'all', label: 'All' }
                    ]}
                    styles={getSelectStyles(isDarkMode)}
                    placeholder="Select gender"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Age
                  </label>
                  <Select
                    value={editFormData.targetAge ? { value: editFormData.targetAge, label: editFormData.targetAge } : null}
                    onChange={(option) => setEditFormData(prev => ({ ...prev, targetAge: option?.value || '' }))}
                    options={[
                      { value: 'all', label: 'All Ages' },
                      { value: '18-25', label: '18-25' },
                      { value: '26-35', label: '26-35' },
                      { value: '36-45', label: '36-45' },
                      { value: '46-55', label: '46-55' },
                      { value: '56-65', label: '56-65' },
                      { value: '65+', label: '65+' }
                    ]}
                    styles={getSelectStyles(isDarkMode)}
                    placeholder="Select age range"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={handleCloseEditModal}
                  className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedAd}
                  className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsCart;
