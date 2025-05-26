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
      let userId;
      if (res.status === 200 && res.data?.data) {
        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          userId = res.data.data[0].id;
        } else if (res.data.data.id) {
          userId = res.data.data.id;
        }
        alert(res.data?.message || 'OTP sent successfully');
        setUser({
          id: userId,
          accessToken: null,
          phone,
          isRegistered: false,
          username: '',
          bio: '',
          wallet: 0,
          isPremium: false,
          referralEarnings: 0,
        });
        navigate('/verify-otp');
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (err) {
      console.error('handleSendOtp error:', err);
      alert('Error sending OTP. Please try again.');
    }
  }

  return {
    phone,
    setPhone,
    handleSendOtp,
  };
}
