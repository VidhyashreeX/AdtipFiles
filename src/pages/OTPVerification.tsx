import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { InputOTP } from "@/components/ui/input-otp";
import { apiSendOtp, apiSendEmailOtp } from "../api";
import { cn } from "@/lib/utils";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verificationType, setVerificationType] = useState<"phone" | "email">("phone");
  const navigate = useNavigate();
  const { verifyOTP, verifyEmailOTP } = useAuth();

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

    const storedCountdown = localStorage.getItem("otpCountdown");
    if (storedCountdown) {
      const timeLeft = parseInt(storedCountdown) - Math.floor(Date.now() / 1000);
      if (timeLeft > 0) setCountdown(timeLeft);
    }
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
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
      if (!tempUserId) throw new Error("Session expired. Please login again.");

      let result;
      if (verificationType === "phone") {
        result = await verifyOTP(mobileNumber, otp, tempUserId);
      } else {
        result = await verifyEmailOTP(email, otp, tempUserId);
      }

      if (result?.data?.success || result?.data?.message === "OTP verify successful.") {
        if (!result.data.data?.[0]) {
          throw new Error("Invalid server response: missing user data");
        }

        const { id, is_registered, isSaveUserDetails = 0 } = result.data.data[0];
        
        // Clear session data
        localStorage.setItem("UserId", id.toString());
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("mobile_number");
        localStorage.removeItem("email");
        localStorage.removeItem("otpCountdown");
        
        toast.success("OTP verified successfully");

        // Navigate based on user state
        if (is_registered === 1) {
          navigate(isSaveUserDetails === 0 ? "/complete-profile" : "/home", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } else {
        throw new Error(result?.data?.message || "Failed to verify OTP");
      }
    } catch (error) {
      let errorMsg = "Failed to verify OTP";
      // Check for HTTP 500 or similar
      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response.status === 'number') {
          if (error.response.status === 500) {
            errorMsg = "Internal Server Error (500)";
          } else if (error.response.data && typeof error.response.data.message === 'string') {
            errorMsg = error.response.data.message;
          } else if (error.response.data && typeof error.response.data.sqlMessage === 'string') {
            errorMsg = error.response.data.sqlMessage;
          }
        } else if ('status' in error && (error as any).status === 500) {
          errorMsg = "Internal Server Error (500)";
        } else if ('message' in error && typeof (error as any).message === 'string') {
          errorMsg = (error as any).message;
        } else if ('sqlMessage' in error && typeof (error as any).sqlMessage === 'string') {
          errorMsg = (error as any).sqlMessage;
        } else {
          errorMsg = JSON.stringify(error);
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
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
      const response = verificationType === "phone"
        ? await apiSendOtp(mobileNumber)
        : await apiSendEmailOtp(email);

      if (response?.data?.success || response?.data?.status === 200) {
        localStorage.setItem("otpCountdown", (Math.floor(Date.now() / 1000) + 30).toString());
        setCountdown(30);
        toast.success("OTP resent successfully");
      } else {
        throw new Error(response?.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-md mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/login")}
          className="mb-8 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Login
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Verify Your {verificationType === "phone" ? "Phone" : "Email"}
          </h1>
          
          <p className="text-center text-gray-600 mb-8">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-gray-900">
              {verificationType === "phone" ? mobileNumber : email}
            </span>
          </p>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (!loading && otp.length === 6) handleVerifyOTP();
            }}
            autoComplete="off"
          >
            <div className="space-y-6">
              <InputOTP
                value={otp}
                onChange={val => {
                  setOtp(val);
                  if (val.length === 6 && !loading) {
                    handleVerifyOTP();
                  }
                }}
                maxLength={6}
                disabled={loading}
              />

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-adtip-teal hover:bg-adtip-teal/90 text-white transition-colors"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify Code"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || countdown > 0}
                  className={cn(
                    "text-adtip-teal hover:text-adtip-teal/90 transition-colors",
                    "disabled:text-gray-400 disabled:cursor-not-allowed"
                  )}
                >
                  {resendLoading
                    ? "Sending..."
                    : countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Resend code"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our</p>
          <p className="mt-1">
            <a href="/terms" className="text-adtip-teal hover:underline">Terms of Service</a>
            {" "}&amp;{" "}
            <a href="/privacy" className="text-adtip-teal hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
