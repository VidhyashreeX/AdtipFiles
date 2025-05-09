import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../UserContext";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setUser } = useUser();

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
      console.log("Attempting login with:", { phoneNumber });
      const response = await login(phoneNumber);
      console.log("Login successful, response:", response);
      setUser({
        id: response?.id || Math.random().toString(36).substring(2, 15),
        phone: phoneNumber,
        accessToken: null,
        isRegistered: response?.isRegistered || false,
        username: "newuser",
        bio: "Welcome to AdTip!",
        wallet: 0,
        isPremium: false,
        referralEarnings: 0,
      });
      setIsLoading(false);
      navigate("/verify-otp", { state: { phoneNumber, id: response?.id || "" } });
    } catch (err: any) {
      console.error("Login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setIsLoading(false);
      const errorMessage =
        err.message ||
        err.response?.data?.error ||
        (err.response?.status === 500
          ? "Server error: Database issue. Please try again later."
          : "Could not send OTP. Please try again.");
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