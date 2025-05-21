<<<<<<< HEAD
import axios from "axios";

const BASE_URL = "http://3.6.15.198:7082";

export async function apiSendOtp(mobileNumber: string) {
  const url = `${BASE_URL}/api/otplogin`;
  try {
    // Validate mobile number
    if (!mobileNumber || mobileNumber.trim() === "") {
      throw new Error("Mobile number is required");
    }
    // Ensure 10-digit phone number
    const formattedNumber = mobileNumber.replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(formattedNumber)) {
      throw new Error("Invalid mobile number format");
    }
    console.log("Sending OTP request:", { mobileNumber, formattedNumber, url });
    // Use payload structure as per API spec
    const payload = {
      mobileNumber: formattedNumber,
      userType: "2"
    };
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
      localStorage.setItem("mobile_number", mobile_number.replace(/\D/g, "").slice(-10)); // Store 10-digit number
      console.log("Stored in localStorage from /api/otplogin:", { tempUserId: id, mobile_number: mobile_number.replace(/\D/g, "").slice(-10) });
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
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to send OTP. Server error occurred.";
    throw new Error(errorMessage);
  }
}

export async function apiVerifyOtp(mobile_number: string, otp: string, id: string) {
  const url = `${BASE_URL}/api/otpverify`;
  try {
    // Validate inputs
    if (!mobile_number || !otp || !id) {
      throw new Error("Mobile number, OTP, and ID are required");
    }
    // Ensure 10-digit phone number
    const formattedNumber = mobile_number.replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(formattedNumber)) {
      throw new Error("Invalid mobile number format");
    }
    console.log("Verifying OTP:", { mobile_number, formattedNumber, otp, id, url });
    const payload = {
      mobile_number: formattedNumber,
      otp,
      id
    };
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
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      rawResponse: error.response ? JSON.stringify(error.response, null, 2) : "No response",
    });
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to verify OTP. Server error occurred.";
    throw new Error(errorMessage);
  }
}

export async function apiSaveUserDetails(userDetails: {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  gender: string;
  dob: string;
  profile_image: string;
  profession: string;
  maternal_status: string;
  address: string;
  emailId: string;
  longitude: string;
  latitude: string;
  pincode: string;
  languages: number[];
  interests: number[];
  referal_code: string;
}) {
  const url = `${BASE_URL}/api/saveuserdetails`;
  try {
    // Validate inputs
    if (!userDetails.id || !userDetails.name || !userDetails.emailId) {
      throw new Error("User ID, name, and email are required");
    }
    console.log("Saving user details:", { userDetails, url });
    const response = await axios.post(url, userDetails, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Save user details response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("apiSaveUserDetails error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
      isNetworkError: error.message === "Network Error",
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      rawResponse: error.response ? JSON.stringify(error.response, null, 2) : "No response",
    });
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to save user details. Server error occurred.";
    throw new Error(errorMessage);
  }
}

export async function apiPing() {
  const url = `${BASE_URL}/api/ping`;
  try {
    console.log("Pinging server:", { url });
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Ping response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("apiPing error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url,
      isNetworkError: error.message === "Network Error",
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      rawResponse: error.response ? JSON.stringify(error.response, null, 2) : "No response",
    });
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to ping server. Server error occurred.";
    throw new Error(errorMessage);
  }
}
=======
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
>>>>>>> bffb8d82164a4e29ac985da94d8b6a3e8e279e2c
