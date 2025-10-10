import React, { useState } from 'react';
import { CreditCard, Wallet, Building, Shield, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentGateway = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems = [], totalAmount = 0 } = location.state || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentComplete(true);
      
      setTimeout(() => {
        navigate('/seller/ad-orders');
      }, 2000);
    }, 3000);
  };

  const handleBack = () => {
    navigate('/seller/ads-cart');
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-[#f5f5ff] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto border border-gray-200 dark:border-gray-800">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your advertising campaigns have been activated successfully.</p>
          <div className="text-xl font-bold text-[#00dcaa]">₹ {totalAmount.toLocaleString()}</div>
          <p className="text-sm text-gray-500 mt-2">Redirecting to Ad Orders...</p>
        </div>
      </div>
    );
  }

  const subtotal = totalAmount;
  const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
  const gst = Math.round((subtotal + platformFee) * 0.18); // 18% GST
  const finalTotal = subtotal + platformFee + gst;

  return (
    <div className="min-h-screen bg-[#f5f5ff]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            title="Go back to cart"
            aria-label="Go back to cart"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Gateway</h1>
            <p className="text-gray-600">Secure payment for your ad campaigns</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#00dcaa]/10 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#00dcaa]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
              </div>
              <p className="text-gray-600 text-sm">Select Payment Method</p>
            </div>

            <div className="p-6">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                    selectedPaymentMethod === 'card' 
                      ? 'border-[#00dcaa] bg-[#00dcaa]/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-[#00dcaa]" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Credit/Debit Card</div>
                    <div className="text-xs text-gray-500">Visa, Mastercard, RuPay</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`p-4 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                    selectedPaymentMethod === 'upi' 
                      ? 'border-[#00dcaa] bg-[#00dcaa]/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Wallet className="w-6 h-6 text-[#00dcaa]" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">UPI</div>
                    <div className="text-xs text-gray-500">PhonePe, GPay, Paytm</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                  className={`p-4 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                    selectedPaymentMethod === 'netbanking' 
                      ? 'border-[#00dcaa] bg-[#00dcaa]/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building className="w-6 h-6 text-[#00dcaa]" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Net Banking</div>
                    <div className="text-xs text-gray-500">All major banks</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className={`p-4 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                    selectedPaymentMethod === 'wallet' 
                      ? 'border-[#00dcaa] bg-[#00dcaa]/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Wallet className="w-6 h-6 text-[#00dcaa]" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Digital Wallet</div>
                    <div className="text-xs text-gray-500">Paytm, MobiKwik, Amazon Pay</div>
                  </div>
                </button>
              </div>

              {/* Payment Form */}
              {selectedPaymentMethod === 'card' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      value={paymentData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        value={paymentData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                        value={paymentData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Enter name as on card"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00dcaa] focus:border-transparent"
                      value={paymentData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="p-4 bg-[#00dcaa]/5 rounded-lg border border-[#00dcaa]/20">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-[#00dcaa] mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 mb-1">Secure Payment</div>
                    <div className="text-gray-600">
                      Your payment information is encrypted and secure. We never store your payment details.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Payment Summary</h3>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                {cartItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.type}</div>
                    </div>
                    <div className="font-semibold text-gray-900">₹{item.price.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="text-gray-900">₹{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="text-gray-900">₹{gst.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-[#00dcaa]">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* What happens next section */}
              <div className="bg-[#00dcaa]/5 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">What happens next?</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#00dcaa] rounded-full"></div>
                    <span>Payment confirmation email</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#00dcaa] rounded-full"></div>
                    <span>Ad review within 24 hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#00dcaa] rounded-full"></div>
                    <span>Campaign goes live after approval</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#00dcaa] rounded-full"></div>
                    <span>Real-time tracking dashboard</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-[#00dcaa] text-white py-4 rounded-lg text-lg font-semibold hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay ₹{finalTotal.toLocaleString()} Securely</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;