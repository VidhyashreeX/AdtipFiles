import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useUser } from "../UserContext";
import { apiVerifyOtp, apiSendOtp } from "../api";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  const { phoneNumber, id, isSaveUserDetails } = location.state || {};

  useEffect(() => {
    // Redirect to login if no phone number or ID is available
    const storedPhone = localStorage.getItem("mobileNumber") || phoneNumber || user.phone;
    const storedId = localStorage.getItem("tempUserId") || id || user.id;
    if (!storedPhone || !storedId) {
      navigate("/login");
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
      // Prioritize stored values from localStorage or UserContext
      const userId = localStorage.getItem("tempUserId") || id || user.id;
      const phone = localStorage.getItem("mobileNumber") || phoneNumber || user.phone || "";
      if (!phone || !userId) throw new Error("Missing phone number or user ID");

      const res = await apiVerifyOtp(phone, otpValue, userId);
      console.log("apiVerifyOtp response:", res);

      if (res.status === 200) {
        const userData = res.data?.[0] || {};
        setUser({
          ...user,
          accessToken: res.accessToken || user.accessToken,
          id: userData.id?.toString() || user.id || userId,
          phone: phone,
          isRegistered: userData.isSaveUserDetails === 1,
          username: userData.username || userData.name || user.username || "newuser",
          bio: userData.bio || user.bio || "Welcome to AdTip!",
          wallet: userData.referal_earnings || user.wallet || 0,
          isPremium: userData.is_premium || userData.premium_plan_id !== 0 || user.isPremium || false,
          referralEarnings: userData.referal_earnings || user.referralEarnings || 0,
          name: userData.name || user.name,
          gender: userData.gender || user.gender,
          dateOfBirth: userData.dob || user.dateOfBirth,
          profession: userData.profession || user.profession,
          profilePic: userData.profile_image || user.profilePic,
          interests: userData.interests?.map((i: { name: string }) => i.name) || user.interests,
          maritalStatus: userData.maternal_status || user.maritalStatus,
        });
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("mobileNumber");

        // Navigate based on isSaveUserDetails
        if (userData.isSaveUserDetails === 1) {
          console.log("Navigating to /home: User details are saved");
          navigate("/home");
        } else {
          console.log("Navigating to /personal-details: User needs to complete profile");
          navigate("/personal-details");
        }
      } else {
        setError(res.message || "Invalid OTP");
      }
    } catch (err: any) {
      console.error("OTP verification error:", err.message);
      setError(err.message || "Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setCounter(30);
    setError("");
    try {
      const phone = localStorage.getItem("mobileNumber") || phoneNumber || user.phone || "";
      if (!phone) throw new Error("Phone number is missing for resend");

      const res = await apiSendOtp(phone);
      if (res.data?.[0]?.id) {
        localStorage.setItem("tempUserId", res.data[0].id.toString());
        localStorage.setItem("mobileNumber", res.data[0].mobile_number);
      }
      alert("OTP has been resent!");
    } catch (err: any) {
      console.error("Resend OTP error:", err.message);
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
          Enter the 6-digit code sent to {localStorage.getItem("mobileNumber") || phoneNumber || user.phone || "your phone"}
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