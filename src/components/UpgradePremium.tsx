import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedSubscriptionPlan } from "../utils/EnhancedSubscriptionPlan";
import { usePremiumState } from "../stores/wallet-premium.store";

const UpgradePremium = () => {
  const navigate = useNavigate();
  const premiumState = usePremiumState();

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white dark:from-teal-700 dark:to-teal-800">
        <div className="max-w-screen-md mx-auto p-6">
          <div className="flex items-center mb-8">
            <button onClick={() => navigate("/wallet")}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold ml-2">
              {premiumState.isPremium ? "Manage Premium Plan" : "Upgrade to Premium"}
            </h1>
          </div>
          
          {premiumState.isPremium && (
            <div className="text-center mb-4">
              <p className="text-white/90">
                Current Plan: {premiumState.premiumPlanName || "Premium"}
              </p>
              {premiumState.premiumExpiresAt && (
                <p className="text-white/70 text-sm">
                  Expires: {new Date(premiumState.premiumExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          {premiumState.isPremium ? "Upgrade Your Plan" : "Choose Your Premium Plan"}
        </h2>
        <p className="text-muted-foreground mb-6">
          Get access to premium features, ad-free experience, and priority support
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <EnhancedSubscriptionPlan
            duration="1 Month"
            price={200}
            planId={1}
            transactionFor="upgrade_premium"
            upgradeEndpoint="upgrade-premium"
            planType="premium"
            features={[
              "Ad-free experience",
              "Priority support",
              "Exclusive content access",
              "Premium badge"
            ]}
          />
          <EnhancedSubscriptionPlan
            duration="6 Months"
            price={1200}
            planId={2}
            transactionFor="upgrade_premium"
            upgradeEndpoint="upgrade-premium"
            planType="premium"
            isPopular
            features={[
              "All 1-month features",
              "50% savings",
              "Extended support",
              "Early access to new features"
            ]}
          />
          <EnhancedSubscriptionPlan
            duration="1 Year"
            price={2400}
            planId={3}
            transactionFor="upgrade_premium"
            upgradeEndpoint="upgrade-premium"
            planType="premium"
            features={[
              "All 6-month features",
              "Maximum savings",
              "VIP support",
              "Beta feature access"
            ]}
          />
        </div>
        
        <div className="text-center">
          <Button
            className="teal-button"
            onClick={() => navigate("/upgrade-content-premium")}
          >
            View Content Creator Plans
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePremium;