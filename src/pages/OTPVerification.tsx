import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { apiSendOtp, apiSendEmailOtp } from "../api";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verificationType, setVerificationType] = useState<"phone" | "email">("phone");
  const navigate = useNavigate();
  const { verifyOTP, verifyEmailOTP, updateUserProfile } = useAuth();

  useEffect(() => {
    const storedMobile = localStorage.getItem("mobile_number");
    const storedEmail = localStorage.getItem("email");
    const tempUserId = localStorage.getItem("tempUserId");

    if (!tempUserId || (!storedMobile && !storedEmail)) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    if (storedMobile) {
      setMobileNumber(storedMobile);
      setVerificationType("phone");
    } else if (storedEmail) {
      setEmail(storedEmail);
      setVerificationType("email");
    }

    // Start countdown if it exists
    const storedCountdown = localStorage.getItem("otpCountdown");
    if (storedCountdown) {
      const timeLeft = parseInt(storedCountdown) - Math.floor(Date.now() / 1000);
      if (timeLeft > 0) {
        setCountdown(timeLeft);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            localStorage.removeItem("otpCountdown");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const tempUserId = localStorage.getItem("tempUserId");
      if (!tempUserId) {
        throw new Error("Session expired. Please login again.");
      }

      let result;
      if (verificationType === "phone") {
        const storedMobile = localStorage.getItem("mobile_number");
        if (!storedMobile) {
          throw new Error("Session expired. Please login again.");
        }
        result = await verifyOTP(storedMobile, otp, tempUserId);
      } else {
        const storedEmail = localStorage.getItem("email");
        if (!storedEmail) {
          throw new Error("Session expired. Please login again.");
        }
        result = await verifyEmailOTP(storedEmail, otp, tempUserId);
      }

      if (result?.data?.success || result?.data?.message === "OTP verify successful.") {
        // Handle array response properly
        const userDataFromResponse = Array.isArray(result.data.data) ? result.data.data[0] : result.data.data;
        
        console.log("OTP verification response:", {
          userData: userDataFromResponse,
          accessToken: result.data.accessToken,
          message: result.data.message
        });
        
        if (!userDataFromResponse) {
          throw new Error("Invalid response: Missing user data");
        }

        // Get access token from the correct location
        const accessToken = result.data.accessToken;

        if (!accessToken) {
          throw new Error("Invalid response: Missing access token");
        }

        // Clean up temporary session values
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("mobile_number");
        localStorage.removeItem("email");
        localStorage.removeItem("otpCountdown");
        
        // Create user data object with all necessary fields
        const userData = {
          id: userDataFromResponse.id,
          name: userDataFromResponse.name || "",
          phone: userDataFromResponse.mobile_number,
          email: userDataFromResponse.email || "",
          accessToken: accessToken,
          isRegistered: userDataFromResponse.is_registered === 1,
          isSaveUserDetails: userDataFromResponse.isSaveUserDetails
        };

        // Save user data in localStorage and update auth context
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("UserLoggedIn", accessToken);
        localStorage.setItem("userId", userData.id.toString());

        // Update the auth context with user data
        updateUserProfile(userData);
        
        toast.success("OTP verified successfully");

        // Only check isSaveUserDetails for redirection
        if (userDataFromResponse.isSaveUserDetails === 0) {
          console.log("User details not saved, redirecting to complete profile...", userData);
          navigate("/complete-profile", { replace: true });
          return;
        }

        // If user details are saved, redirect to home
        console.log("User details saved, redirecting to home...", userData);
        navigate("/home", { replace: true });
      } else {
        throw new Error(result?.data?.message || "Failed to verify OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds before requesting a new OTP`);
      return;
    }

    setResendLoading(true);
    try {
      let response;
      if (verificationType === "phone") {
        response = await apiSendOtp(mobileNumber);
      } else {
        response = await apiSendEmailOtp(email);
      }

      if (response?.data?.success) {
        localStorage.setItem("otpCountdown", (Math.floor(Date.now() / 1000) + 30).toString());
        setCountdown(30);
        toast.success("OTP resent successfully");
      } else {
        throw new Error(response?.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-white">
      <div className="mb-8">
        <button
          onClick={() => navigate("/login")}
          className="text-gray-500 flex items-center hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">
          Enter verification code
        </h1>

        <p className="text-center text-gray-600 mb-8">
          We've sent a 6-digit code to{" "}
          {verificationType === "phone" ? mobileNumber : email}
        </p>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index} {...slot} index={index} />
                  ))}
                </InputOTPGroup>
              )}
            />
          </div>

          <Button
            onClick={handleVerifyOTP}
            className="w-full bg-adtip-teal hover:bg-adtip-teal/90 text-white"
            disabled={loading || otp.length !== 6}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="text-center">
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || countdown > 0}
              className="text-adtip-teal hover:text-adtip-teal/90 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendLoading
                ? "Sending..."
                : countdown > 0
                ? `Resend OTP in ${countdown}s`
                : "Resend OTP"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>By continuing, you agree to our</p>
          <p>
            <a href="/terms" className="text-adtip-teal hover:text-adtip-teal/90 transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-adtip-teal hover:text-adtip-teal/90 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;