import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// You may want to move this to a config file
const RAZORPAY_KEY_ID = "rzp_test_YourKeyHere"; // Replace with your Razorpay key

const RazorpayCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, planLabel } = location.state || {};

  useEffect(() => {
    if (!amount) {
      navigate("/chooseplan");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount * 100, // Razorpay expects paise
        currency: "INR",
        name: "AdTip",
        description: planLabel || "Subscription Plan",
        image: "/logo.png",
        handler: function (response: any) {
          // TODO: handle payment success (call backend, show success, etc)
          alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
          navigate("/", { replace: true });
        },
        prefill: {
          // Optionally prefill user info
        },
        theme: {
          color: "#43e97b",
        },
        modal: {
          ondismiss: function () {
            navigate("/chooseplan");
          },
        },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    return () => {
      document.body.removeChild(script);
    };
  }, [amount, planLabel, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#e0ecf7] px-2 py-8">
      <div className="bg-white/90 rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
        <img src="/logo.png" alt="AdTip Logo" className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-adtip-teal">Processing Payment</h2>
        <p className="text-gray-700 mb-4 text-center">Redirecting you to Razorpay checkout for <span className="font-semibold">{planLabel}</span>.<br/>Please do not refresh or close this window.</p>
        <div className="w-16 h-16 border-4 border-adtip-teal border-t-transparent rounded-full animate-spin mb-2"></div>
      </div>
    </div>
  );
};

export default RazorpayCheckout;
