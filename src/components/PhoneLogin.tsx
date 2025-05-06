import React from 'react';
import { usePhoneLoginController } from '../hooks/usePhoneLoginController';

export default function PhoneLogin() {
  const { phone, setPhone, handleSendOtp } = usePhoneLoginController();

  return (
    <div>
      <h2>Login with Mobile</h2>
      <input
        placeholder="Enter phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={handleSendOtp}>Send OTP</button>
    </div>
  );
}
