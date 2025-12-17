import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Phone, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "../../contexts/AuthModalContext";
import { useEnhancedAuth, useAuthActions, useAuthError, useAuthLoading } from "../../stores/enhanced-auth.store";
import { cn } from "@/lib/utils";

export const EnhancedLoginModal = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  const [inputError, setInputError] = useState<string>("");
  
  const { showLoginModal, closeLoginModal, openOTPModal } = useAuthModal();
  const { login, loginWithEmail, clearError } = useAuthActions();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  // Clear errors when modal opens/closes or tab changes
  useEffect(() => {
    if (showLoginModal) {
      clearError();
      setInputError("");
      setPhoneNumber("");
      setEmail("");
    }
  }, [showLoginModal, clearError]);

  useEffect(() => {
    clearError();
    setInputError("");
  }, [activeTab, clearError]);

  if (!showLoginModal) return null;

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) {
      setInputError("Phone number is required");
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      setInputError("Please enter a valid 10-digit phone number");
      return false;
    }
    setInputError("");
    return true;
  };

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue) {
      setInputError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setInputError("Please enter a valid email address");
      return false;
    }
    setInputError("");
    return true;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber) || isLoading) return;

    try {
      const result = await login(phoneNumber);
      
      if (result.success) {
        openOTPModal(phoneNumber, ""); // tempUserId is managed in the store
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email) || isLoading) return;

    try {
      const result = await loginWithEmail(email);
      
      if (result.success) {
        openOTPModal("", ""); // Values are managed in the store
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      console.error("Email login error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
    if (inputError && cleaned.length === 10) {
      setInputError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (inputError && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInputError("");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] transition-opacity duration-300"
        onClick={closeLoginModal}
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
            onClick={closeLoginModal}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 dark:hover:bg-gray-800/20 rounded-full transition-colors z-10"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="AdTip Logo" className="h-16 w-16" />
            </div>

            <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">
              Welcome to AdTip
            </h1>

            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Choose your preferred login method
            </p>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setActiveTab('phone')}
                disabled={isLoading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-200",
                  activeTab === 'phone'
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Phone className="h-4 w-4" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                disabled={isLoading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-200",
                  activeTab === 'email'
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>

            {/* Error Display */}
            {(error || inputError) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {inputError || error}
                </p>
              </div>
            )}

            {/* Phone Login Form */}
            {activeTab === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="relative">
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-100/50 dark:bg-gray-800/50 border border-r-0 border-white/30 dark:border-gray-700/30 rounded-l-xl text-gray-600 dark:text-gray-400">
                      +91
                    </span>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 rounded-l-none backdrop-blur-xl focus:border-adtip-teal focus:ring-adtip-teal",
                        (inputError || error) && "border-red-300 dark:border-red-700"
                      )}
                      style={{
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                      }}
                    />
                  </div>
                  {phoneNumber.length === 10 && !inputError && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white font-semibold h-12 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !phoneNumber || phoneNumber.length !== 10}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            )}

            {/* Email Login Form */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "w-full bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-xl focus:border-adtip-teal focus:ring-adtip-teal",
                      (inputError || error) && "border-red-300 dark:border-red-700"
                    )}
                    style={{
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                    }}
                  />
                  {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !inputError && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white font-semibold h-12 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>By continuing, you agree to our</p>
              <p className="mt-1">
                <a 
                  href="/terms" 
                  className="text-adtip-teal hover:underline" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    closeLoginModal(); 
                  }}
                >
                  Terms of Service
                </a>
                {" "}and{" "}
                <a 
                  href="/privacy" 
                  className="text-adtip-teal hover:underline" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    closeLoginModal(); 
                  }}
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};