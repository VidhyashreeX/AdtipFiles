import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios"; // Import axios
import { BASE_URL } from "../api"; // Import BASE_URL from your api file

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Define the function to send OTP
  const apiSendOtp = async (mobileNumber: string) => {
    const url = `${BASE_URL}/api/otplogin`;
    try {
      console.log("Sending OTP request:", { mobileNumber, url });
      const response = await axios.post(url, { mobileNumber });
      console.log("OTP response:", response.data);
      return response.data; // Ensure this returns the expected structure
    } catch (error: any) {
      console.error("apiSendOtp error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url,
      });
      // Check if the server returned a specific error message
      const errorMessage = error.response?.data?.error || "Failed to send OTP. Please try again.";
      throw new Error(errorMessage); // Throw the specific error message
    }
  };

  // Define the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      console.log("Attempting login with:", { fullPhoneNumber });
      await apiSendOtp(fullPhoneNumber); // Call the apiSendOtp function
      setIsLoading(false);
      console.log("Navigating to /verify-otp");
      navigate("/verify-otp");
    } catch (err: any) {
      console.error("Login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setIsLoading(false);
      const errorMessage =
        err.response?.status === 404
          ? "Unable to connect to OTP service. Please try again later."
          : err.response?.data?.error || err.message || "Could not send OTP. Please try again.";
      setError(errorMessage);
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
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-r border-gray-300 flex items-center">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-700"
              >
                <option value="+91">+91 IN</option>
                <option value="+1">+1 US</option>
                <option value="+44">+44 UK</option>
              </select>
            </div>
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