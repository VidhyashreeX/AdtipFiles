import axios from "axios";

const BASE_URL = "http://3.6.15.198:7082";

export async function apiSendOtp(mobileNumber: string) {
  const url = `${BASE_URL}/api/otplogin`;
  try {
    console.log("Sending OTP request:", { mobileNumber, url });
    const payload = { mobileNumber };
    const response = await axios.post(url, payload);
    console.log("OTP response:", response.data);
    // Handle various response structures
    const userData = response.data.data
      ? Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data
      : {};
    const { id, mobile_number } = userData;
    if (id && mobile_number) {
      localStorage.setItem("tempUserId", id.toString());
      localStorage.setItem("mobile_number", mobile_number);
      console.log("Stored in localStorage:", { tempUserId: id, mobile_number });
    } else {
      console.warn("Missing id or mobile_number in response:", response.data);
      throw new Error("Invalid API response: missing id or mobile_number");
    }
    return response.data;
  } catch (error: any) {
    console.error("apiSendOtp error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
    });
    throw new Error(error.response?.data?.message || "Failed to send OTP.");
  }
}

export async function apiVerifyOtp(mobile_number: string, otp: string, id: string) {
  const url = `${BASE_URL}/api/otpverify`;
  try {
    console.log("Verifying OTP:", { mobile_number, otp, id, url });
    const payload = { mobile_number, otp, id };
    const response = await axios.post(url, payload);
    console.log("OTP verify response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("apiVerifyOtp error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
    });
    throw new Error(error.response?.data?.message || "Failed to verify OTP.");
  }
}

export async function apiLogout(id: string) {
  const url = `${BASE_URL}/api/logout`;
  try {
    console.log("Logging out:", { id, url });
    const response = await axios.post(url, { id });
    console.log("Logout response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("apiLogout error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
    });
    throw new Error(error.response?.data?.message || "Failed to logout.");
  }
}