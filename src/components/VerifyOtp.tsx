import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiVerifyOtp } from "../api";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { phoneNumber, id } = location.state || {};
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  console.log("Rendering VerifyOtp with state:", { phoneNumber, id });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiVerifyOtp(phoneNumber, otp, id || "");
      console.log("OTP verified:", response);
      setIsLoading(false);
      if (response.status === 200) {
        navigate(response.isRegistered ? "/home" : "/personal-details", {
          state: { phoneNumber },
        });
      } else {
        setError("Invalid OTP");
      }
    } catch (err: any) {
      console.error("OTP verification error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setIsLoading(false);
      const errorMessage =
        err.response?.data?.error || "Invalid OTP. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate("/login")}
          className="text-gray-500 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="flex justify-center mb-6">
          <img src="logo.png" alt="AdTip Logo" className="h-16 w-16" />
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">Verify OTP</h1>
        <p className="text-center mb-4">
          Enter the 4-digit OTP sent to {phoneNumber || "your phone number"}
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="flex-1 border-none focus-visible:ring-0"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="teal-button w-full"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;