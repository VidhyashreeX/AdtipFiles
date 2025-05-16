import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhoneNumber = `+91${phoneNumber}`;
      console.log("Attempting login with:", { phoneNumber, formattedPhoneNumber });
      const response = await login(formattedPhoneNumber);
      console.log("Login response:", JSON.stringify(response, null, 2));

      const userData = response.data?.[0] || response.data || {};
      const navState = {
        phoneNumber: userData.mobile_number || formattedPhoneNumber,
        id: userData.id?.toString() || localStorage.getItem("tempUserId") || "",
        isSaveUserDetails: userData.isSaveUserDetails ?? 0,
      };
      console.log("Navigating to /verify-otp with state:", JSON.stringify(navState, null, 2));
      if (response.isPartial) {
        console.warn("Partial response received, navigating with temporary data");
        setError("OTP sent, but server response was incomplete. Please proceed to verify.");
      }
      setIsLoading(false);
      navigate("/verify-otp", { state: navState });
    } catch (err: any) {
      console.error("Login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        rawResponse: err.response ? JSON.stringify(err.response, null, 2) : "No response",
      });
      setIsLoading(false);
      if (err.message.includes("Failed to send OTP") || err.message.includes("Network error")) {
        console.warn("Server error, but OTP likely sent, navigating to verify-otp");
        const navState = {
          phoneNumber: `+91${phoneNumber}`,
          id: localStorage.getItem("tempUserId") || `temp_${Date.now()}`,
          isSaveUserDetails: 0,
        };
        setError("OTP sent, but server response failed. Please proceed to verify.");
        navigate("/verify-otp", { state: navState });
      } else {
        setError(err.message || "Could not send OTP. Please check your connection or try again later.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate("/onboarding")}
          className="text-gray-500 flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <img src="logo.png" alt="AdTip Logo" className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">
          Enter your phone number
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <Input
              type="tel"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 border-none focus-visible:ring-0"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="teal-button w-full"
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our</p>
          <p>
            <a href="/terms" className="text-adtip-teal">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-adtip-teal">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;