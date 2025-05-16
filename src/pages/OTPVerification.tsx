import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiSendOtp } from "../api";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, verifyOTP } = useAuth();
  const { phoneNumber, id, isSaveUserDetails: stateIsSaveUserDetails } = location.state || {};

  useEffect(() => {
    console.log("Rendering OTPVerification component", {
      phoneNumber,
      id,
      stateIsSaveUserDetails,
      locationState: location.state,
      user,
      localStorage: {
        mobile_number: localStorage.getItem("mobile_number"),
        tempUserId: localStorage.getItem("tempUserId"),
        adtip_user: localStorage.getItem("adtip_user"),
      },
    });
    const storedPhone = phoneNumber || localStorage.getItem("mobile_number") || user?.phone;
    const storedId = id || localStorage.getItem("tempUserId") || user?.id;
    if (!storedPhone || !storedId) {
      console.warn("Missing phone or ID, redirecting to login", { storedPhone, storedId });
      navigate("/login", { replace: true });
    }
  }, [user, phoneNumber, id, navigate]);

  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (value && !/^\d*$/.test(value)) return;

    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = value.slice(-1);
      return newOtp;
    });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const storedPhone = phoneNumber || localStorage.getItem("mobile_number") || user?.phone;
      const storedId = id || localStorage.getItem("tempUserId") || user?.id;
      if (!storedPhone || !storedId) {
        throw new Error("Missing phone number or ID");
      }
      console.log("Verifying OTP with:", { mobile_number: storedPhone, otp: otpValue, id: storedId });
      const verifyResponse = await verifyOTP(otpValue, storedId);
      console.log("verifyOTP response:", JSON.stringify(verifyResponse, null, 2));
      if (verifyResponse.success) {
        const apiIsSaveUserDetails = verifyResponse.data?.isSaveUserDetails ?? stateIsSaveUserDetails ?? (user?.isRegistered ? 1 : 0);
        const isRegistered = apiIsSaveUserDetails === 1;
        const nextPath = isRegistered ? "/home" : "/personal-details";
        console.log(`Navigating to ${nextPath}`, {
          apiIsSaveUserDetails,
          stateIsSaveUserDetails,
          isRegistered,
          userIsRegistered: user?.isRegistered,
        });
        navigate(nextPath, { replace: true });
      } else {
        setError(verifyResponse.message || "Invalid OTP");
      }
    } catch (err: any) {
      console.error("OTP verification error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        rawResponse: err.response ? JSON.stringify(err.response, null, 2) : "No response",
      });
      setError(err.message || "Failed to verify OTP. Please try again or request a new OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setCounter(30);
    setError("");
    try {
      const phone = localStorage.getItem("mobile_number") || phoneNumber || user?.phone || "";
      if (!phone) throw new Error("Phone number is missing for resend");

      console.log("Resending OTP for:", phone);
      const res = await apiSendOtp(phone);
      console.log("Resend OTP response:", JSON.stringify(res, null, 2));
      alert("OTP has been resent!");
    } catch (err: any) {
      console.error("Resend OTP error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        rawResponse: err.response ? JSON.stringify(err.response, null, 2) : "No response",
      });
      setError(err.message || "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate("/login")}
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

        <h1 className="text-2xl font-bold mb-2 text-center">Verify your number</h1>

        <p className="text-center text-gray-500 mb-8">
          Enter the 6-digit code sent to {localStorage.getItem("mobile_number") || phoneNumber || user?.phone || "your phone"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between max-w-sm mx-auto">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 text-center text-xl"
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            className="teal-button w-full max-w-xs mx-auto block"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          {counter > 0 ? (
            <p className="text-gray-500">
              Resend code in <span className="font-semibold">{counter}s</span>
            </p>
          ) : (
            <button onClick={resendOTP} className="text-adtip-teal font-medium">
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;