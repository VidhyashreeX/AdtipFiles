import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiVerifyOtp } from '../api';
import { useUser } from '../UserContext';

export default function OtpPage() {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const { user, setUser } = useUser();

  async function handleVerifyOtp() {
    if (!user.id || !user.phone) {
      alert('OTP ID missing! Please login again.');
      navigate('/');
      return;
    }

    try {
      const res = await apiVerifyOtp(user.phone, otp, user.id);
      if (res.status === 200) {
        alert(res.message);

        // ✅ Save accessToken globally now
        setUser({
          ...user,
          accessToken: res.accessToken,
        });

        // navigate('/dashboard'); // if you have a dashboard page
      } else {
        alert('Invalid OTP');
      }
    } catch (err) {
      console.error(err);
      alert('Error verifying OTP');
    }
  }

  return (
    <div>
      <h2>Enter OTP</h2>
      <input
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={handleVerifyOtp}>Verify OTP</button>

      <br />
      <button onClick={() => navigate('/')}>🔙 Back to Login</button>
    </div>
  );
}

//In OtpPage.tsx ➔ Get user_id from global context (no location.state needed!)