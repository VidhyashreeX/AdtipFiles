import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedSubscriptionPlan } from "../utils/EnhancedSubscriptionPlan";
import { usePremiumState } from "../stores/wallet-premium.store";

const UpgradeContentPremium = () => {
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
              {premiumState.isContentCreatorPremium ? "Manage Creator Plan" : "Upgrade to Content Creator"}
            </h1>
          </div>
          
          {premiumState.isContentCreatorPremium && (
            <div className="text-center mb-4">
              <p className="text-white/90">
                Current Plan: {premiumState.contentCreatorPlanName || "Content Creator Premium"}
              </p>
              {premiumState.contentCreatorExpiresAt && (
                <p className="text-white/70 text-sm">
                  Expires: {new Date(premiumState.contentCreatorExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          {premiumState.isContentCreatorPremium ? "Upgrade Your Creator Plan" : "Choose Your Content Creator Plan"}
        </h2>
        <p className="text-muted-foreground mb-6">
          Unlock enhanced content creation tools, higher earnings, and advanced analytics
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <EnhancedSubscriptionPlan
            duration="1 Month"
            price={2500}
            planId={1}
            transactionFor="upgrade_content_premium"
            upgradeEndpoint="upgrade-content-premium"
            planType="content_creator"
            features={[
              "Enhanced creation tools",
              "Higher earnings rate",
              "Basic analytics",
              "Priority review"
            ]}
          />
          <EnhancedSubscriptionPlan
            duration="3 Months"
            price={6000}
            planId={2}
            transactionFor="upgrade_content_premium"
            upgradeEndpoint="upgrade-content-premium"
            planType="content_creator"
            features={[
              "All 1-month features",
              "20% savings",
              "Advanced analytics",
              "Faster withdrawals"
            ]}
          />
          <EnhancedSubscriptionPlan
            duration="6 Months"
            price={12000}
            planId={3}
            transactionFor="upgrade_content_premium"
            upgradeEndpoint="upgrade-content-premium"
            planType="content_creator"
            isPopular
            features={[
              "All 3-month features",
              "40% savings",
              "Premium analytics",
              "Lower platform fees"
            ]}
          />
          <EnhancedSubscriptionPlan
            duration="12 Months"
            price={22000}
            planId={4}
            transactionFor="upgrade_content_premium"
            upgradeEndpoint="upgrade-content-premium"
            planType="content_creator"
            features={[
              "All 6-month features",
              "Maximum savings",
              "VIP creator support",
              "Exclusive features"
            ]}
          />
        </div>
        
        <div className="text-center">
          <Button
            className="teal-button"
            onClick={() => navigate("/upgrade-premium")}
          >
            View Premium Plans
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeContentPremium;
