import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionPlan } from "../utils/SubscriptionPlan";

const UpgradePremium = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 md:pb-0 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white">
        <div className="max-w-screen-md mx-auto p-6">
          <div className="flex items-center mb-8">
            <button onClick={() => navigate("/wallet")}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold ml-2">Upgrade Plan</h1>
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">Choose Your Premium Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <SubscriptionPlan
            duration="1 Month"
            price={200}
            planId={1}
            transactionFor="upgrade_premium"
            upgradeEndpoint="upgrade-premium"
          />
          <SubscriptionPlan
            duration="6 Months"
            price={1200}
            planId={2}
            transactionFor="upgrade_premium"
            upgradeEndpoint="upgrade-premium"
            isPopular
          />
          <SubscriptionPlan
            duration="1 Year"
            price={2400}
            planId={3}
            transactionFor="upgrade_premium"
            upgradeEndpoint="upgrade-premium"
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