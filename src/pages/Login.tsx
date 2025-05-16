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

    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting login with:", { phoneNumber });
      const response = await login(phoneNumber); // Pass 10-digit phone number
      console.log("Login response:", JSON.stringify(response, null, 2));

      const userData = response.data?.[0] || response.data || {};
      const navState = {
        phoneNumber: userData.mobile_number || phoneNumber, // Store without +91
        id: userData.id?.toString() || localStorage.getItem("tempUserId") || "",
        isSaveUserDetails: userData.isSaveUserDetails ?? 0,
      };
      console.log("Navigating to /verify-otp with state:", JSON.stringify(navState, null, 2));
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
      if (err.message.includes("Unknown column")) {
        setError("Server error: Unable to send OTP. Please try again or contact support.");
      } else {
        setError(err.message || "Could not send OTP. Please check your phone number and try again.");
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