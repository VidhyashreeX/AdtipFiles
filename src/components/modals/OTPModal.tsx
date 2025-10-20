import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useAuthModal } from "../../contexts/AuthModalContext";
import { InputOTP } from "@/components/ui/input-otp";
import { authAPI } from "../../services/api";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const OTPModal = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { verifyOTP } = useAuth();
  const { showOTPModal, closeOTPModal, phoneNumber, tempUserId } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0 && showOTPModal) {
      interval = setInterval(() => {
        setCountdown((prev) => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdown, showOTPModal]);

  useEffect(() => {
    if (showOTPModal) {
      setCountdown(30);
      setOtp("");
    }
  }, [showOTPModal]);

  if (!showOTPModal) return null;

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      if (document.activeElement?.tagName === 'INPUT') return;
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, otp, tempUserId);

      if (result) {
        toast.success("OTP verified successfully");
        closeOTPModal();
        
        // Wait for authentication state to be properly set
        const checkAuthState = () => {
          const token = localStorage.getItem('UserLoggedIn');
          const user = localStorage.getItem('user');
          
          if (token && user) {
            navigate("/home", { replace: true });
          } else {
            setTimeout(checkAuthState, 200);
          }
        };
        
        setTimeout(checkAuthState, 500);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const response = await authAPI.sendOTP(phoneNumber);

      if (response.status === 200) {
        setCountdown(30);
        toast.success("OTP resent successfully");
      } else {
        toast.error("Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] transition-opacity duration-300"
        onClick={closeOTPModal}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div 
          className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 w-full max-w-md overflow-hidden"
          style={{
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={closeOTPModal}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 dark:hover:bg-gray-800/20 rounded-full transition-colors z-10"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
              Verify Your Phone
            </h1>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {phoneNumber}
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
                    if (val.length === 6 && /^\d{6}$/.test(val) && !loading) {
                      handleVerifyOTP();
                    }
                  }}
                  maxLength={6}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white font-semibold rounded-xl shadow-lg"
                  disabled={loading || otp.length !== 6 || !/^\d{6}$/.test(otp)}
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
                      "text-adtip-teal hover:text-adtip-teal/90 transition-colors font-medium",
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
        </div>
      </div>
    </>
  );
};
