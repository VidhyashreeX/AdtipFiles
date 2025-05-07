import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useUser } from "../UserContext";
import { apiVerifyOtp, apiSendOtp } from "../api";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  useEffect(() => {
    let isMounted = true;
    if (!user.id || !user.phone) {
      if (isMounted) {
        navigate("/login");
      }
    }
    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

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

    if (value && index < 3) {
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
    if (otpValue.length !== 4) {
      setError("Please enter the complete OTP");
      return;
    }

    setIsLoading(true);
    try {
      const userId = localStorage.getItem("tempUserId") || user.id || "0";
      const res = await apiVerifyOtp(user.phone!, otpValue, userId);
      if (res.status === 200) {
        setUser({
          ...user,
          accessToken: res.accessToken,
          id: res.id || user.id,
          isRegistered: res.isRegistered !== undefined ? res.isRegistered : true,
          username: res.username || user.username || "newuser",
          bio: res.bio || user.bio || "Welcome to AdTip!",
          wallet: res.wallet || user.wallet || 0,
          isPremium: res.isPremium || user.isPremium || false,
          referralEarnings: res.referralEarnings || user.referralEarnings || 0,
          name: res.name || user.name,
          gender: res.gender || user.gender,
          dateOfBirth: res.dateOfBirth || user.dateOfBirth,
          profession: res.profession || user.profession,
          profilePic: res.profilePic || user.profilePic,
          interests: res.interests || user.interests,
        });
        if (res.isRegistered || user.isRegistered) {
          navigate("/home");
        } else {
          navigate("/personal-details");
        }
      } else {
        setError("Invalid OTP");
      }
    } catch (err: any) {
      console.error("OTP verification error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setCounter(30);
    setError("");
    try {
      await apiSendOtp(user.phone!);
      alert("OTP has been resent!");
    } catch (err: any) {
      console.error("Resend OTP error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to resend OTP. Please try again.");
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
          Enter the 4-digit code sent to your phone
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between max-w-xs mx-auto">
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-16 h-16 text-center text-2xl"
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
            <button
              onClick={resendOTP}
              className="text-adtip-teal font-medium"
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;