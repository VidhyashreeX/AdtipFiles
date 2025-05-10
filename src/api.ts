import axios from "axios";

const BASE_URL = "http://3.6.15.198:7082";

export async function apiSendOtp(mobileNumber: string) {
  const url = `${BASE_URL}/api/otplogin`;
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Sending OTP request:", { mobileNumber, url });
    }
    const payload = { mobileNumber };
    const response = await axios.post(url, payload);
    if (process.env.NODE_ENV !== "production") {
      console.log("OTP response:", response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("apiSendOtp error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
    });
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Failed to send OTP. Please try again.";
    throw new Error(errorMessage);
  }
}

export async function apiVerifyOtp(mobile_number: string, otp: string, id: string) {
  const url = `${BASE_URL}/api/otpverify`;
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Verifying OTP:", { mobile_number, otp, id, url });
    }
    const payload = { mobile_number, otp, id };
    const response = await axios.post(url, payload);
    if (process.env.NODE_ENV !== "production") {
      console.log("OTP verify response:", response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("apiVerifyOtp error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
    });
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Failed to verify OTP.";
    throw new Error(errorMessage);
  }
}

export async function apiLogout(id: string) {
  const url = `${BASE_URL}/api/logout`;
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Logging out:", { id, url });
    }
    const response = await axios.post(url, { id });
    if (process.env.NODE_ENV !== "production") {
      console.log("Logout response:", response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("apiLogout error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
    });
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Failed to logout. Please try again.";
    throw new Error(errorMessage);
  }
} 