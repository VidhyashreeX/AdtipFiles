import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const RAZORPAY_KEY = "rzp_test_ojNkCSTYuUL3w9"; // Replace with your Razorpay key
const BASE_URL = "http://localhost:7082/api";

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface SubscriptionPlanProps {
  duration: string;
  price: number;
  planId: number;
  isPopular?: boolean;
  transactionFor: string;
  upgradeEndpoint: string;
}

export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({
  duration,
  price,
  planId,
  isPopular,
  transactionFor,
  upgradeEndpoint,
}) => {
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("UserId") || "54625";
  const token = localStorage.getItem("UserLoggedIn") || "";

  const handleSelectPlan = async () => {
    try {
      setLoading(true);
      console.log(`Initiating payment for plan: ${duration}, planId: ${planId}, amount: ₹${price}, transactionFor: ${transactionFor}`);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay SDK");
        setLoading(false);
        return;
      }

      const orderResponse = await axios.post(
        `${BASE_URL}/razorpay-order`,
        {
          amount: price * 100, // Convert rupees to paise
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
        alert(`Order creation failed: ${orderResponse.data.message}`);
        setLoading(false);
        return;
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: orderResponse.data.data.amount,
        currency: "INR",
        name: "Your Business Name",
        description: `${transactionFor === "upgrade_premium" ? "Premium" : "Content Creator"} Plan - ${duration}`,
        order_id: orderResponse.data.data.id,
        handler: async (response: any) => {
          try {
            console.log(`Payment successful for ${duration}:`, response);

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
              alert(`Payment verification failed: ${verificationResponse.data.message || "Unknown error"}`);
              return;
            }

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
              alert(`${duration} plan activated successfully!`);
            } else {
              alert(`Plan activation failed: ${upgradeResponse.data.message || "Unknown error"}`);
            }
          } catch (err) {
            console.error("Error:", err);
            alert(`Error processing payment: ${(err as Error).message}`);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#F37254",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error:", err);
      alert(`Error occurred: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <div
      className={`border rounded-lg p-6 relative bg-white shadow-sm transition-transform hover:scale-105 ${
        isPopular ? "border-adtip-teal" : "border-gray-200"
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-adtip-teal text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
          Popular
        </div>
      )}
      <h3 className="text-xl font-bold">{duration}</h3>
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-bold">₹{price}</span>
        <span className="text-gray-500 text-sm ml-1">/ {duration.toLowerCase()}</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>All premium features</span>
        </li>
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>Faster withdrawals</span>
        </li>
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>Lower fees</span>
        </li>
        <li className="flex items-center">
          <span className="text-green-500 mr-2">✓</span>
          <span>Higher earnings</span>
        </li>
      </ul>
      <Button
        className="w-full mt-6 bg-[#F37254] hover:bg-[#d65a3f] text-white"
        onClick={handleSelectPlan}
        disabled={loading}
      >
        {loading ? "Processing..." : "Select Plan"}
      </Button>
    </div>
  );
};