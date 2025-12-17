import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Wallet, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { 
  useEnhancedWalletState,
  useEnhancedAddTransaction,
  useEnhancedUpdateWalletBalance,
  useEnhancedRefreshWalletBalance,
  useEnhancedFormatCurrency
} from "../stores/enhanced-wallet-premium.store";
import { cn } from "@/lib/utils";

const RAZORPAY_KEY = 'rzp_test_ojNkCSTYuUL3w9';
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// Predefined amount options
const AMOUNT_OPTIONS = [100, 200, 500, 1000, 2000, 5000];

const EnhancedAddFunds: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const walletState = useEnhancedWalletState();
  const addTransaction = useEnhancedAddTransaction();
  const updateWalletBalance = useEnhancedUpdateWalletBalance();
  const refreshWalletBalance = useEnhancedRefreshWalletBalance();
  const formatCurrency = useEnhancedFormatCurrency();

  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId = user?.id;
  const token = user?.accessToken;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getSelectedAmount = (): number => {
    return selectedAmount || Number(customAmount) || 0;
  };

  const handlePayment = async () => {
    const amount = getSelectedAmount();

    if (!userId || !token) {
      toast.error("Please log in to add funds");
      return;
    }

    if (amount < 10) {
      toast.error("Minimum amount is ₹10");
      return;
    }

    if (amount > 100000) {
      toast.error("Maximum amount is ₹1,00,000");
      return;
    }

    setIsLoading(true);

    try {
      console.log(`🔄 Initiating add funds payment: ₹${amount}`);

      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Payment system failed to load. Please try again.');
        setIsLoading(false);
        return;
      }

      // Step 1: Create Razorpay order
      const orderResponse = await fetch(`${BASE_URL}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          user_id: Number(userId)
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.status) {
        throw new Error(orderData.message || 'Order creation failed');
      }

      // Add pending transaction
      addTransaction({
        type: 'deposit',
        amount,
        currency: 'INR',
        status: 'pending',
        description: `Add funds to wallet`,
        orderId: orderData.data.id,
      });

      // Step 2: Configure Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.data.amount,
        currency: 'INR',
        name: 'AdTip',
        description: 'Add Funds to Wallet',
        order_id: orderData.data.id,
        handler: async function (response: any) {
          try {
            console.log(`✅ Payment successful:`, response);

            // Step 3: Verify payment
            const verificationResponse = await fetch(`${BASE_URL}/razorpay-verification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                transaction_for: 'add_funds',
                order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: orderData.data.amount / 100,
                currency: 'INR',
                user_id: Number(userId),
                payment_status: 'success'
              })
            });

            const verificationData = await verificationResponse.json();
            if (!verificationData.status) {
              throw new Error(verificationData.message || 'Payment verification failed');
            }

            // Step 4: Update wallet
            const addFundsResponse = await fetch(`${BASE_URL}/addfunds`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                createdby: Number(userId),
                amount: orderData.data.amount / 100,
                transactionStatus: '1',
                transaction_type: 'Deposite',
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                isCron: false
              })
            });

            const addFundsData = await addFundsResponse.json();

            if (addFundsData.status === 200) {
              // Update wallet balance in store
              const newBalance = walletState.balance + amount;
              updateWalletBalance(newBalance);

              // Add successful transaction
              addTransaction({
                type: 'deposit',
                amount,
                currency: 'INR',
                status: 'completed',
                description: `Funds added successfully`,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });

              // Refresh wallet balance from server to ensure accuracy
              setTimeout(() => {
                refreshWalletBalance(userId.toString());
              }, 1000);

              toast.success(`🎉 ${formatCurrency(amount)} added to your wallet successfully!`);
              
              // Reset form
              setSelectedAmount(null);
              setCustomAmount('');
              
              // Navigate back to wallet
              setTimeout(() => {
                navigate('/wallet');
              }, 2000);

            } else {
              throw new Error(addFundsData.message || 'Failed to update wallet');
            }
          } catch (err: any) {
            console.error('❌ Error processing payment:', err);
            
            // Add failed transaction
            addTransaction({
              type: 'deposit',
              amount,
              currency: 'INR',
              status: 'failed',
              description: `Failed to add funds`,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });

            const errorMessage = err.message || 'Error processing payment';
            toast.error(`❌ ${errorMessage}`);
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("💭 Payment modal dismissed");
            setIsLoading(false);
            
            // Add cancelled transaction
            addTransaction({
              type: 'deposit',
              amount,
              currency: 'INR',
              status: 'failed',
              description: `Payment cancelled`,
              orderId: orderData.data.id,
            });
          }
        },
        prefill: {
          name: user?.name || 'AdTip User',
          email: user?.emailId || 'user@adtip.com',
          contact: user?.mobile_number || '9999999999'
        },
        theme: {
          color: '#00dcaa'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (err: any) {
      console.error('❌ Error initiating payment:', err);
      const errorMessage = err.message || 'Error occurred while initiating payment';
      toast.error(`❌ ${errorMessage}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white dark:from-teal-700 dark:to-teal-800">
        <div className="max-w-screen-md mx-auto p-6">
          <div className="flex items-center mb-8">
            <button onClick={() => navigate('/wallet')}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold ml-2">Add Funds</h1>
          </div>

          {/* Current Balance */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Wallet className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Current Balance</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(walletState.balance)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-6">
        {/* Amount Selection */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-adtip-teal" />
            Select Amount
          </h2>

          {/* Predefined Amounts */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {AMOUNT_OPTIONS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                disabled={isLoading}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  selectedAmount === amount
                    ? "border-adtip-teal bg-adtip-teal/10 text-adtip-teal"
                    : "border-gray-200 dark:border-gray-700 hover:border-adtip-teal/50 text-gray-700 dark:text-gray-300"
                )}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter amount"
                min="10"
                max="100000"
                disabled={isLoading}
                className={cn(
                  "w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-adtip-teal focus:border-transparent",
                  "bg-background text-foreground border-gray-200 dark:border-gray-700"
                )}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₹10 • Maximum: ₹1,00,000
            </p>
          </div>

          {/* Payment Summary */}
          {getSelectedAmount() > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Amount to add:</span>
                <span className="font-semibold text-lg">{formatCurrency(getSelectedAmount())}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Current balance:</span>
                <span>{formatCurrency(walletState.balance)}</span>
              </div>
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">New balance:</span>
                <span className="font-semibold text-adtip-teal">
                  {formatCurrency(walletState.balance + getSelectedAmount())}
                </span>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={getSelectedAmount() < 10 || isLoading}
            className="w-full h-12 bg-gradient-to-r from-adtip-teal to-[#13b799] hover:from-[#13b799] hover:to-adtip-teal text-white font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Add {getSelectedAmount() > 0 ? formatCurrency(getSelectedAmount()) : 'Funds'}
              </div>
            )}
          </Button>

          {/* Security Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure payment powered by Razorpay • Your money is safe with us
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Credit Card', icon: '💳' },
              { name: 'Debit Card', icon: '💳' },
              { name: 'UPI', icon: '📱' },
              { name: 'Net Banking', icon: '🏦' },
            ].map((method) => (
              <div
                key={method.name}
                className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <span className="text-2xl mb-1">{method.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{method.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAddFunds;