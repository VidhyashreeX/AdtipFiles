import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";

const OTPVerify = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(40);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, phoneNumber } = location.state || {};

  const BASE_URL = "http://localhost:7082/";

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const verifyOTP = async () => {
    if (!userId) {
      setError("User ID missing");
      return;
    }
    try {
      setLoading(true);
      console.log("Verifying OTP for userId:", userId, "OTP:", otp);
      const response = await axios.post(
        `${BASE_URL}otpverify`,
        { id: userId, otp },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("OTP Verify Response:", response);
      if (response.status === 200) {
        const data = response.data.data[0];
        localStorage.setItem("UserLoggedIn", response.data.accessToken);
        localStorage.setItem("UserId", String(data.id));
        localStorage.setItem("name", data.name || "");
        localStorage.setItem("profileImage", data.profile_image || "");
        localStorage.setItem("gender", data.gender || "");
        localStorage.setItem("profession", data.profession || "");
        localStorage.setItem("maritalStatus", data.maternal_status || "");
        localStorage.setItem("age", data.dob || "");
        alert("OTP verified successfully!");
        navigate("/dashboard"); // Adjust based on checkUserDetailsAndRedirect logic
      }
    } catch (err) {
      console.error("OTP Verify Error:", err.response || err.message);
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BASE_URL}otplogin`,
        { mobileNumber: phoneNumber, userType: "2" },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        setTimer(40);
        alert("OTP resent successfully!");
      }
    } catch (err) {
      console.error("Resend OTP Error:", err.response || err.message);
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
      <p className="mb-4">Enter the OTP sent to {phoneNumber}</p>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4"
      />
      <Button
        onClick={verifyOTP}
        disabled={loading}
        className="w-full mb-4"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </Button>
      {timer > 0 ? (
        <p className="text-gray-500">Resend OTP in {timer}s</p>
      ) : (
        <Button
          onClick={resendOTP}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Resending..." : "Resend OTP"}
        </Button>
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default OTPVerify;