import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Clock, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "../../contexts/AuthModalContext";
import { InputOTP } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  useEnhancedAuth, 
  useAuthActions, 
  useAuthError, 
  useOTPSession,
  useCanResendOTP,
  useResendCooldown
} from "../../stores/enhanced-auth.store";

export const EnhancedOTPModal = () => {
  const [otp, setOtp] = useState("");
  const [inputError, setInputError] = useState("");
  
  const { showOTPModal, closeOTPModal, openLoginModal } = useAuthModal();
  const { verifyOTP, resendOTP, clearError, clearOTPSession } = useAuthActions();
  const navigate = useNavigate();
  
  // Get state from the enhanced store
  const otpSession = useOTPSession();
  const error = useAuthError();
  const canResendOTP = useCanResendOTP();
  const resendCooldownSeconds = useResendCooldown();
  const { isOTPLoading, isResendLoading } = useEnhancedAuth();

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (showOTPModal) {
      clearError();
      setInputError("");
      setOtp("");
    }
  }, [showOTPModal, clearError]);

  // Auto-close modal if no session
  useEffect(() => {
    if (showOTPModal && !otpSession) {
      closeOTPModal();
      openLoginModal();
    }
  }, [showOTPModal, otpSession, closeOTPModal, openLoginModal]);

  if (!showOTPModal || !otpSession) return null;

  const validateOTP = (otpValue: string): boolean => {
    if (!otpValue) {
      setInputError("OTP is required");
      return false;
    }
    if (!/^\d{6}$/.test(otpValue)) {
      setInputError("Please enter a valid 6-digit OTP");
      return false;
    }
    setInputError("");
    return true;
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP(otp) || isOTPLoading) return;

    try {
      const result = await verifyOTP(otp);
      
      if (result.success) {
        toast.success(result.message);
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
      } else {
        toast.error(result.message);
        // Don't clear OTP on verification failure to allow retry
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOTP || isResendLoading) return;

    try {
      const result = await resendOTP();
      
      if (result.success) {
        toast.success(result.message);
        setOtp(""); // Clear current OTP input
        setInputError("");
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleOTPChange = (value: string) => {
    setOtp(value);
    if (inputError && /^\d{6}$/.test(value)) {
      setInputError("");
    }
    
    // Auto-verify when 6 digits are entered
    if (value.length === 6 && /^\d{6}$/.test(value) && !isOTPLoading) {
      setTimeout(() => handleVerifyOTP(), 100);
    }
  };

  const handleBackToLogin = () => {
    clearOTPSession();
    closeOTPModal();
    openLoginModal();
  };

  const getDisplayContact = () => {
    if (otpSession.type === 'phone') {
      return `+91 ${otpSession.phoneNumber}`;
    }
    return otpSession.email;
  };

  const getContactType = () => {
    return otpSession.type === 'phone' ? 'Phone' : 'Email';
  };

  // Calculate session expiry
  const sessionExpiryMinutes = Math.max(0, Math.ceil((otpSession.expiresAt - Date.now()) / (1000 * 60)));
  const isSessionExpired = sessionExpiryMinutes <= 0;

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
            disabled={isOTPLoading}
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
              Verify Your {getContactType()}
            </h1>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
              Enter the 6-digit code sent to
            </p>
            
            <p className="text-center font-medium text-gray-900 dark:text-gray-100 mb-6">
              {getDisplayContact()}
            </p>

            {/* Session Status */}
            {!isSessionExpired && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Code expires in {sessionExpiryMinutes} minute{sessionExpiryMinutes !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Session Expired Warning */}
            {isSessionExpired && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    Session Expired
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Please request a new OTP to continue
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {(error || inputError) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {inputError || error}
                </p>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!isOTPLoading && otp.length === 6) handleVerifyOTP();
              }}
              autoComplete="off"
            >
              <div className="space-y-6">
                {/* OTP Input */}
                <div className="relative">
                  <InputOTP
                    value={otp}
                    onChange={handleOTPChange}
                    maxLength={6}
                    disabled={isOTPLoading || isSessionExpired}
                    className={cn(
                      (inputError || error) && "border-red-300 dark:border-red-700"
                    )}
                  />
                  {otp.length === 6 && !inputError && !error && (
                    <CheckCircle className="absolute -right-8 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>

                {/* Verify Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isOTPLoading || otp.length !== 6 || !/^\d{6}$/.test(otp) || isSessionExpired}
                >
                  {isOTPLoading ? (
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

                {/* Resend Section */}
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isResendLoading || !canResendOTP}
                    className={cn(
                      "inline-flex items-center gap-2 text-adtip-teal hover:text-adtip-teal/90 transition-colors font-medium",
                      "disabled:text-gray-400 disabled:cursor-not-allowed"
                    )}
                  >
                    {isResendLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : !canResendOTP ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Resend in {resendCooldownSeconds}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Resend code
                      </>
                    )}
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>

                {/* Attempt Counter */}
                {otpSession.attemptCount > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Attempts: {otpSession.attemptCount}/{otpSession.maxAttempts}
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};