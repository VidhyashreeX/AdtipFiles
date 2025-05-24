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
      if (res.status === 200 && res.data?.data?.id) {
        alert(res.data?.message || 'OTP sent successfully');

        const userId = res.data.data.id;

        setUser({
          id: userId,
          accessToken: null,
          phone,
          isRegistered: false, // Default value
          username: '', // Default value
          bio: '', // Default value
          wallet: 0, // Default value
          isPremium: false, // Default value
          referralEarnings: 0, // Default value
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
