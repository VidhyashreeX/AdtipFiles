import axios from "axios";

const BASE_URL = "http://3.6.15.198:7082";

export async function apiSendOtp(mobileNumber: string) {
  const url = `${BASE_URL}/api/otplogin`;
  try {
    console.log("Sending OTP request:", { mobileNumber, url });
    const payload = { mobileNumber };
    console.log("Sending OTP payload:", JSON.stringify(payload, null, 2));
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Raw OTP response:", JSON.stringify(response.data, null, 2));

    // Handle response structure
    const userData = response.data.data
      ? Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data
      : response.data;
    const { id, mobile_number } = userData;

    if (id && mobile_number) {
      localStorage.setItem("tempUserId", id.toString());
      localStorage.setItem("mobile_number", mobile_number);
      console.log("Stored in localStorage from /api/otplogin:", { tempUserId: id, mobile_number });
    } else {
      console.error("Missing id or mobile_number in response:", response.data);
      throw new Error("Invalid API response: missing id or mobile_number");
    }
    return response.data;
  } catch (error: any) {
    console.error("apiSendOtp error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
      isNetworkError: error.message === "Network Error",
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      rawResponse: error.response ? JSON.stringify(error.response, null, 2) : "No response",
    });
    if (error.message === "Network Error" || error.response?.status === 500) {
      console.warn("Server error (Network or 500), assuming OTP was sent, returning partial response");
      const tempId = `temp_${Date.now()}`;
      localStorage.setItem("tempUserId", tempId);
      localStorage.setItem("mobile_number", mobileNumber);
      console.log("Stored fallback in localStorage:", { tempUserId: tempId, mobile_number: mobileNumber });
      return {
        data: [{ id: tempId, mobile_number: mobileNumber }],
        isPartial: true,
      };
    }
    const errorMessage = error.response?.data?.message?.sqlMessage || (typeof error.response?.data?.message === 'object' ? JSON.stringify(error.response?.data?.message) : error.response?.data?.message) || error.response?.data?.error || JSON.stringify(error.response?.data) || "Failed to send OTP. Server error occurred.";
    throw new Error(errorMessage);
  }
}

export async function apiVerifyOtp(mobile_number: string, otp: string, id?: string) {
  const url = `${BASE_URL}/api/otpverify`;
  try {
    console.log("Verifying OTP:", { mobile_number, otp, id, url });
    const payload = id ? { mobile_number, otp, id } : { mobile_number, otp };
    console.log("Verifying OTP payload:", JSON.stringify(payload, null, 2));
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Raw OTP verify response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("apiVerifyOtp error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
      isNetworkError: error.message === "Network Error",
      sqlMessage: error.response?.data?.message?.sqlMessage,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      rawResponse: error.response ? JSON.stringify(error.response, null, 2) : "No response",
    });
    const errorMessage = error.response?.data?.message?.sqlMessage || (typeof error.response?.data?.message === 'object' ? error.response?.data?.message?.sqlMessage || JSON.stringify(error.response?.data?.message) : error.response?.data?.message) || error.response?.data?.error || JSON.stringify(error.response?.data) || "Failed to verify OTP. Server error occurred.";
    throw new Error(errorMessage);
  }
}

export async function apiLogout(id: string) {
  const url = `${BASE_URL}/api/logout`;
  try {
    console.log("Logging out:", { id, url });
    const response = await axios.post(url, { id }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Logout response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("apiLogout error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
      isNetworkError: error.message === "Network Error",
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      rawResponse: error.response ? JSON.stringify(error.response, null, 2) : "No response",
    });
    throw new Error(error.response?.data?.message || "Failed to logout. Server error occurred.");
  }
}