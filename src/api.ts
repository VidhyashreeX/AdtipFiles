import axios from 'axios';

const BASE_URL = 'http://3.6.15.198:7082'; // 🔴 Replace with your backend URL

export async function apiSendOtp(mobileNumber: string) {
  const response = await axios.post(`${BASE_URL}/api/otplogin`, {
    mobileNumber,
  });
  return response.data;
}

export async function apiVerifyOtp(mobile_number: string, otp: string, id: number) {
  const response = await axios.post(`${BASE_URL}/api/otpverify`, {
    mobile_number,
    otp,
    id,
  });
  return response.data;
}

export async function apiLogout(id: number) {
  const response = await axios.post(`${BASE_URL}/api/logout`, {
    id,
  });
  return response.data;
}
