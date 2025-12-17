import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Zap } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { 
  useEnhancedAddTransaction,
  useEnhancedUpdatePremiumStatus,
  useEnhancedRefreshPremiumStatus,
  useEnhancedFormatCurrency
} from "../stores/enhanced-wallet-premium.store";
import { cn } from "@/lib/utils";

const RAZORPAY_KEY = "rzp_test_ojNkCSTYuUL3w9";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface EnhancedSubscriptionPlanProps {
  duration: string;
  price: number;
  planId: number;
  isPopular?: boolean;
  transactionFor: 'upgrade_premium' | 'upgrade_content_premium';
  upgradeEndpoint: string;
  features?: string[];
  planType?: 'premium' | 'content_creator';
}

export const EnhancedSubscriptionPlan: React.FC<EnhancedSubscriptionPlanProps> = ({
  duration,
  price,
  planId,
  isPopular,
  transactionFor,
  upgradeEndpoint,
  features = [],
  planType = 'premium',
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const addTransaction = useEnhancedAddTransaction();
  const updatePremiumStatus = useEnhancedUpdatePremiumStatus();
  const refreshPremiumStatus = useEnhancedRefreshPremiumStatus();
  const formatCurrency = useEnhancedFormatCurrency();

  const userId = user?.id;
  const token = user?.accessToken;

  // Default features based on plan type
  const defaultFeatures = planType === 'premium' 
    ? [
        "All premium features",
        "Priority support", 
        "Ad-free experience",
        "Exclusive content access"
      ]
    : [
        "Enhanced content creation tools",
        "Higher earnings rate",
        "Advanced analytics",
        "Priority content review",
        "Faster withdrawals",
        "Lower platform fees"
      ];

  const planFeatures = features.length > 0 ? features : defaultFeatures;

  const handleSelectPlan = async () => {
    if (!userId || !token) {
      toast.error("Please log in to subscribe");
      return;
    }

    try {
      setLoading(true);
      console.log(`🔄 Initiating payment for ${planType} plan:`, {
        duration,
        planId,
        amount: price,
        transactionFor
      });

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment system. Please try again.");
        setLoading(false);
        return;
      }

      // Create Razorpay order
      const orderResponse = await axios.post(
        `${BASE_URL}/razorpay-order`,
        {
          amount: price * 100, // Convert to paise
          currency: "INR",
          user_id: Number(userId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!orderResponse.data.status) {
        throw new Error(orderResponse.data.message || "Failed to create payment order");
      }

      // Add pending transaction
      addTransaction({
        type: 'subscription',
        amount: price,
        currency: 'INR',
        status: 'pending',
        description: `${planType === 'premium' ? 'Premium' : 'Content Creator'} Plan - ${duration}`,
        orderId: orderResponse.data.data.id,
      });

      // Configure Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        amount: orderResponse.data.data.amount,
        currency: "INR",
        name: "AdTip",
        description: `${planType === 'premium' ? 'Premium' : 'Content Creator'} Plan - ${duration}`,
        order_id: orderResponse.data.data.id,
        handler: async (response: any) => {
          try {
            console.log(`✅ Payment successful for ${duration}:`, response);

            // Verify payment
            const verificationResponse = await axios.post(
              `${BASE_URL}/razorpay-verification`,
              {
                transaction_for: transactionFor,
                order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: orderResponse.data.data.amount / 100,
                currency: "INR",
                user_id: Number(userId),
                payment_status: "success",
                plan_id: planId,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!verificationResponse.data.status) {
              throw new Error(verificationResponse.data.message || "Payment verification failed");
            }

            // Activate subscription
            const upgradeResponse = await axios.post(
              `${BASE_URL}/${upgradeEndpoint}`,
              {
                payment_status: "success",
                user_id: Number(userId),
                plan_id: planId,
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                coupon_code: null,
                isCron: false,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (upgradeResponse.data.status) {
              // Update transaction status
              addTransaction({
                type: 'subscription',
                amount: price,
                currency: 'INR',
                status: 'completed',
                description: `${planType === 'premium' ? 'Premium' : 'Content Creator'} Plan - ${duration} (Activated)`,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });

              // Update premium status in store
              const premiumUpdate = planType === 'premium' 
                ? {
                    isPremium: true,
                    premiumPlanId: planId,
                    premiumPlanName: `${duration} Plan`,
                  }
                : {
                    isContentCreatorPremium: true,
                    contentCreatorPlanId: planId,
                    contentCreatorPlanName: `${duration} Creator Plan`,
                  };

              updatePremiumStatus(premiumUpdate);

              // Refresh premium status from server to get latest data
              setTimeout(() => {
                refreshPremiumStatus(userId.toString());
              }, 1000);

              // Update user context if needed
              if (user && typeof user === 'object') {
                const userUpdate = planType === 'premium'
                  ? { 
                      premium: 1, 
                      is_premium: true, 
                      premium_plan_id: planId 
                    }
                  : { 
                      content_creator_premium_status: 1,
                      content_creator_plan_id: planId 
                    };

                // Update user in AuthContext (if updateUser method exists)
                // updateUser(userUpdate);
              }

              toast.success(`🎉 ${duration} ${planType === 'premium' ? 'Premium' : 'Content Creator'} plan activated successfully!`);
              
              // Optional: Navigate to success page or refresh current page
              // navigate('/wallet');
              
            } else {
              throw new Error(upgradeResponse.data.message || "Failed to activate subscription");
            }
          } catch (err: any) {
            console.error("❌ Error processing payment:", err);
            
            // Update transaction status to failed
            addTransaction({
              type: 'subscription',
              amount: price,
              currency: 'INR',
              status: 'failed',
              description: `${planType === 'premium' ? 'Premium' : 'Content Creator'} Plan - ${duration} (Failed)`,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });

            const errorMessage = err.response?.data?.message || err.message || "Payment processing failed";
            toast.error(`❌ ${errorMessage}`);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("💭 Payment modal dismissed");
            setLoading(false);
            
            // Update transaction status to failed if dismissed
            addTransaction({
              type: 'subscription',
              amount: price,
              currency: 'INR',
              status: 'failed',
              description: `${planType === 'premium' ? 'Premium' : 'Content Creator'} Plan - ${duration} (Cancelled)`,
              orderId: orderResponse.data.data.id,
            });
          }
        },
        prefill: {
          name: user?.name || "AdTip User",
          email: user?.emailId || "user@adtip.com",
          contact: user?.mobile_number || "9999999999",
        },
        theme: {
          color: "#00dcaa",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (err: any) {
      console.error("❌ Error initiating payment:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to initiate payment";
      toast.error(`❌ ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-xl p-6 relative bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105",
        isPopular ? "border-adtip-teal ring-2 ring-adtip-teal/20" : "border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white text-xs font-bold px-4 py-1 rounded-full flex items-center">
            <Crown className="h-3 w-3 mr-1" />
            Most Popular
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          {planType === 'premium' ? (
            <Crown className="h-6 w-6 text-adtip-teal mr-2" />
          ) : (
            <Zap className="h-6 w-6 text-adtip-teal mr-2" />
          )}
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {duration}
          </h3>
        </div>
        
        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(price)}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
            / {duration.toLowerCase()}
          </span>
        </div>
        
        {price > 200 && (
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            Save {Math.round(((price / (duration.includes('Month') ? (duration.includes('6') ? 6 : 12) : 1) - 200) / 200) * 100)}%
          </div>
        )}
      </div>

      {/* Features List */}
      <ul className="space-y-3 mb-6">
        {planFeatures.map((feature, index) => (
          <li key={index} className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <Button
        className={cn(
          "w-full h-12 font-semibold transition-all duration-200",
          isPopular
            ? "bg-gradient-to-r from-adtip-teal to-[#13b799] hover:from-[#13b799] hover:to-adtip-teal text-white shadow-lg"
            : "bg-adtip-teal hover:bg-[#13b799] text-white"
        )}
        onClick={handleSelectPlan}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Select ${duration} Plan`
        )}
      </Button>

      {/* Additional Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
        Secure payment • Cancel anytime • Instant activation
      </p>
    </div>
  );
};