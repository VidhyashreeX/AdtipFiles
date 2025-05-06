import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSendOtp } from '../api';
import { useUser } from '../UserContext';

export function usePhoneLoginController() {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  async function handleSendOtp() {
    try {
      const res = await apiSendOtp(phone);
      if (res.status === 200) {
        alert(res.message);

        const userId = res.data[0].id;

        // ✅ Save user globally
        setUser({ id: userId, accessToken: null, phone });

        // ✅ Navigate to OTP page (no location.state needed)
        navigate('/otp');
      } else {
        alert('Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending OTP');
    }
  }

  return {
    phone,
    setPhone,
    handleSendOtp,
  };
}
