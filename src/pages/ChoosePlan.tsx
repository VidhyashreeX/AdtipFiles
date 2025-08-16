import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SubmissionForm from "@/components/ui/SubmissionForm"; // adjust path if needed

const plans = [
  {
    category: "User Packs",
    options: [
      { label: "1 Month Plan", price: 200 },
      { label: "6 Month Plan", price: 1200 },
      { label: "1 Year Plan", price: 2400 },
    ],
    button: "Choose Plan",
  },
  {
    category: "Creator Packs",
    options: [
      { label: "Free Premium Plan", price: 0 }, // ✅ Free plan
      { label: "Monthly Pack", price: 2500 },
      { label: "Quaterly Pack", price: 6000 },
      { label: "Half Yearly Pack", price: 12000 },
      { label: "Yearly Pack", price: 22000 },
    ],
    button: "Choose Plan",
    note: "After applying Referral Coupon\nYearly plan as per selected plan",
  },
  {
    category: "Seller Packs",
    options: [
      { label: "Monthly Pack", price: 5000 },
      { label: "Quaterly Pack", price: 12000 },
      { label: "Half Yearly Pack", price: 24000 },
      { label: "Yearly Pack", price: 48000 },
    ],
    button: "Choose Plan",
    note: "After applying Referral Coupon\nYearly plan as per selected plan",
  },
];

const ChoosePlan = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [showFreePlanForm, setShowFreePlanForm] = useState(false); // modal state
  const [myChannels, setMyChannels] = useState<{ name: string }[]>([]);
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#e0ecf7] px-2 py-8">
        <div className="w-full max-w-5xl bg-white/90 rounded-3xl shadow-2xl p-6 md:p-12 relative border border-gray-200">
          {/* Category Tabs */}
          <div className="flex justify-center mb-6 gap-4">
            {plans.map((plan, idx) => (
              <button
                key={plan.category}
                className={`px-4 py-2 rounded-full font-semibold text-base transition-all border-2 ${
                  selectedCategory === idx
                    ? "bg-adtip-teal text-white border-adtip-teal shadow"
                    : "bg-white text-adtip-teal border-adtip-teal/30 hover:bg-adtip-teal/10"
                }`}
                onClick={() => setSelectedCategory(idx)}
              >
                {plan.category}
              </button>
            ))}
          </div>

          {/* Category Heading */}
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">
            {plans[selectedCategory].category}
          </h2>

          {/* Plan Cards */}
          <div
            className={
              selectedCategory === 0
                ? "flex flex-wrap justify-center gap-8 mb-8"
                : "flex flex-wrap justify-center gap-8 mb-8 md:grid md:grid-cols-4 md:gap-8"
            }
          >
            {plans[selectedCategory].options.map((option) => (
              <div
                key={option.label}
                className="flex flex-col items-center bg-[#f8fafc] rounded-2xl shadow-md px-8 py-6 min-w-[200px] max-w-[260px] border border-gray-200"
              >
                {/* Plan Title */}
                <div className="text-lg font-semibold mb-2 text-gray-800 text-center">
                  {option.label}
                </div>

                {/* Notes */}
                {plans[selectedCategory].note && (
                  <div className="text-xs text-gray-500 text-center mb-1 whitespace-pre-line">
                    {plans[selectedCategory].note}
                  </div>
                )}

                {/* Price */}
                <div className="text-2xl font-bold mb-4 text-gray-900 text-center">
                  ₹{option.price}
                </div>

                {/* Choose Button */}
                <Button
                  className="w-full bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-white font-semibold rounded-full shadow"
                  onClick={() => {
                    if (option.price === 0) {
                      // ✅ for Free Plan open modal instead of going to checkout
                      setShowFreePlanForm(true);
                    } else {
                      navigate("/razorpay-checkout", {
                        state: {
                          amount: option.price,
                          planLabel: option.label,
                        },
                      });
                    }
                  }}
                >
                  {selectedCategory === 0
                    ? "Choose Plan"
                    : plans[selectedCategory].button}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Free Plan */}
      <Dialog open={showFreePlanForm} onOpenChange={setShowFreePlanForm}>
  {showFreePlanForm && (
   <SubmissionForm
  onSuccess={(formData) => {
    setShowFreePlanForm(false);

    // Optional local state
    setMyChannels([{ name: formData.name }]);

    // Persist to localStorage
    localStorage.setItem(
      "channels",
      JSON.stringify([{ name: formData.name }])
    );

    // 🔹 Tell the sidebar instantly (custom browser event)
    window.dispatchEvent(
      new CustomEvent("channelCreated", { detail: { name: formData.name } })
    );
  }}
/>

  )}
</Dialog>
    </>
  );
};

export default ChoosePlan;
