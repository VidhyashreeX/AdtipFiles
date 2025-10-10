import React, { useState } from 'react';
import { ShoppingCart, Edit, Trash2, Bookmark, Plus, ArrowLeft, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdsCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adData } = location.state || {};

  const [pendingAds, setPendingAds] = useState([
    {
      id: 1,
      name: 'Nike Shoes',
      type: 'Skip Video Ad',
      price: 30000,
      image: 'https://via.placeholder.com/80x80',
      status: 'pending'
    },
    {
      id: 2,
      name: 'OnePlus 7 Pro',
      type: 'QR Code Ad',
      price: 10000,
      image: 'https://via.placeholder.com/80x80',
      status: 'pending'
    }
  ]);

  const [savedAds, setSavedAds] = useState([
    {
      id: 3,
      name: 'OnePlus 7 Pro',
      type: 'QR Code Ad',
      price: 10000,
      image: 'https://via.placeholder.com/80x80',
      status: 'saved'
    }
  ]);

  // Add the new ad from preview if it exists
  React.useEffect(() => {
    if (adData) {
      const newAd = {
        id: Date.now(),
        name: adData.contentData?.adTitle || adData.campaignData?.campaignName || 'New Campaign',
        type: adData.selectedModel?.title || 'Skip Video Ad',
        price: 30000,
        image: 'https://via.placeholder.com/80x80',
        status: 'pending'
      };
      setPendingAds(prev => [newAd, ...prev]);
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

  const totalAmount = pendingAds.reduce((sum, ad) => sum + ad.price, 0);

  const handleProceedToPayment = () => {
    navigate('/seller/payment-gateway', {
      state: {
        cartItems: pendingAds,
        totalAmount
      }
    });
  };

  const handleBack = () => {
    navigate('/seller/ad-orders');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-card/20 rounded-lg transition-colors"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-card/20 rounded-lg flex items-center justify-center">
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
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Cart Summary</h2>
              <p className="text-muted-foreground">{pendingAds.length} campaigns ready for payment</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#00dcaa]">₹{totalAmount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
          </div>
        </div>

        {/* Pending Ads */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Ready to Launch</h2>
            <span className="bg-[#00dcaa]/10 text-[#00dcaa] px-3 py-1 rounded-full text-sm font-medium">
              {pendingAds.length} campaigns
            </span>
          </div>

          {pendingAds.length === 0 ? (
            <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add some campaigns to get started with your advertising</p>
              <button
                onClick={() => navigate('/post-ads')}
                className="bg-[#00dcaa] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00b894] transition-colors"
              >
                Create New Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAds.map((ad) => (
                <div key={ad.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
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
                            <h3 className="text-lg font-semibold text-foreground mb-1">{ad.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{ad.type}</p>
                            <div className="text-2xl font-bold text-[#00dcaa]">₹{ad.price.toLocaleString()}</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(ad.id)}
                              className="p-2 text-muted-foreground hover:text-[#00dcaa] hover:bg-[#00dcaa]/10 rounded-lg transition-colors"
                              title="Edit campaign"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleSaveForLater(ad.id)}
                              className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Save for later"
                            >
                              <Bookmark className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRemove(ad.id, 'pending')}
                              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-foreground">Total: ₹{totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{pendingAds.length} campaigns selected</div>
                    </div>
                    <button
                      onClick={handleProceedToPayment}
                      className="bg-[#00dcaa] hover:bg-[#00b894] text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Proceed to Payment</span>
                    </button>
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
              <h2 className="text-2xl font-bold text-foreground">Saved for Later</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {savedAds.length} campaigns
              </span>
            </div>

            <div className="space-y-4">
              {savedAds.map((ad) => (
                <div key={ad.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Campaign Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center overflow-hidden">
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
                            <h3 className="text-lg font-semibold text-foreground mb-1">{ad.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{ad.type}</p>
                            <div className="text-2xl font-bold text-blue-600">₹{ad.price.toLocaleString()}</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAddToCart(ad.id)}
                              className="bg-[#00dcaa] hover:bg-[#00b894] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </button>
                            <button
                              onClick={() => handleRemove(ad.id, 'saved')}
                              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
