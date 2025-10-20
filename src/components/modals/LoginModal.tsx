import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { useAuthModal } from "../../contexts/AuthModalContext";

export const LoginModal = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showLoginModal, closeLoginModal, openOTPModal } = useAuthModal();

  if (!showLoginModal) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(phoneNumber);
      let userData = null;
      
      if (response?.data?.data) {
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          userData = response.data.data[0];
        } else if (typeof response.data.data === "object" && response.data.data.id) {
          userData = response.data.data;
        }
      }

      if (userData && userData.id) {
        openOTPModal(phoneNumber, userData.id.toString());
        toast.success("OTP sent successfully");
      }
    } catch (err: any) {
      let errorMsg = err?.response?.data?.message || err.message || "Could not send OTP. Please try again.";
      if (typeof errorMsg === 'object') {
        errorMsg = errorMsg.sqlMessage || JSON.stringify(errorMsg);
      }
      console.error("Login error:", err);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
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
              Enter your phone number to continue
            </p>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-xl focus:border-adtip-teal focus:ring-adtip-teal"
                  style={{
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white font-semibold h-12 rounded-xl shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>By continuing, you agree to our</p>
              <p className="mt-1">
                <a href="/terms" className="text-adtip-teal hover:underline" onClick={(e) => { e.stopPropagation(); closeLoginModal(); }}>
                  Terms of Service
                </a>
                {" "}and{" "}
                <a href="/privacy" className="text-adtip-teal hover:underline" onClick={(e) => { e.stopPropagation(); closeLoginModal(); }}>
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
