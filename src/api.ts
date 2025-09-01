import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.adtip.in';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error logging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export async function apiSendOtp(mobileNumber: string) {
  const url = `${BASE_URL}/otplogin`;
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

    const payload = {
      mobileNumber: formattedNumber,
      userType: "2"
    };

    const response = await api.post(url, payload);

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to send OTP");
    }

    // The API returns data in an array format
    if (!response.data?.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
      console.error("Invalid API response format:", response.data);
      throw new Error("Invalid API response: missing user data");
    }

    const userData = response.data.data[0];
    
    if (!userData?.id) {
      console.error("No user ID in response:", userData);
      throw new Error("Invalid API response: missing user ID");
    }

    // Clear any existing session data first
    localStorage.removeItem("email");
    localStorage.removeItem("mobile_number");
    localStorage.removeItem("tempUserId");
    localStorage.removeItem("otpCountdown");

    // Store new session data
    localStorage.setItem("tempUserId", userData.id.toString());
    localStorage.setItem("mobile_number", mobileNumber);
    localStorage.setItem("otpCountdown", (Math.floor(Date.now() / 1000) + 30).toString());

    return response;
  } catch (error: any) {
    console.error("apiSendOtp error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to send OTP. Please try again."
    );
  }
}

export async function apiVerifyOtp(mobile_number: string, otp: string, id: string) {
  const url = `${BASE_URL}/otpverify`;
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

    const payload = {
      mobile_number: formattedNumber,
      otp,
      id
    };

    const response = await api.post(url, payload);

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to verify OTP");
    }

    return response;
  } catch (error: any) {
    console.error("apiVerifyOtp error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to verify OTP. Please try again."
    );
  }
}

export async function apiSaveUserDetails(payload: {
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
  const url = `${BASE_URL}/saveuserdetails`;
  try {
    // Validate required fields
    const requiredFields = ['id', 'name', 'firstname', 'lastname', 'gender', 'dob', 'profession', 'maternal_status', 'address', 'emailId', 'longitude', 'latitude', 'pincode'];
    const missingFields = requiredFields.filter(field => !payload[field as keyof typeof payload]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Ensure arrays are not empty
    if (!payload.languages || payload.languages.length === 0) {
      throw new Error('At least one language must be selected');
    }
    if (!payload.interests || payload.interests.length === 0) {
      throw new Error('At least one interest must be selected');
    }

    // Log the payload for debugging
    console.log('Saving user details with payload:', JSON.stringify(payload, null, 2));

    const response = await api.post(url, payload);

    if (response.status !== 200) {
      throw new Error(response.data?.message || 'Failed to save user details');
    }

    return response;
  } catch (error: any) {
    console.error('apiSaveUserDetails error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      payload: JSON.stringify(payload, null, 2)
    });
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to save user details. Server error occurred.'
    );
  }
}

export async function apiPing() {
  const url = `${BASE_URL}/api/ping`;
  try {
    const response = await api.get(url);

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to ping server");
    }

    return response.data;
  } catch (error: any) {
    console.error("apiPing error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to ping server. Please try again."
    );
  }
}

export async function apiSendEmailOtp(email: string) {
  const url = `${BASE_URL}/emailotp`;
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error("Valid email is required");
    }

    const payload = {
      email,
      userType: "2"
    };

    const response = await api.post(url, payload);

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to send OTP");
    }

    const userData = response.data.data
      ? Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data
      : response.data;

    if (!userData?.id || !userData?.email) {
      throw new Error("Invalid API response: missing user data");
    }

    localStorage.setItem("tempUserId", userData.id.toString());
    localStorage.setItem("email", userData.email);

    return response;
  } catch (error: any) {
    console.error("apiSendEmailOtp error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to send OTP. Please try again."
    );
  }
}

export async function apiVerifyEmailOtp(email: string, otp: string, id: string) {
  const url = `${BASE_URL}/emailotpverify`;
  try {
    // Validate inputs
    if (!email || !otp || !id) {
      throw new Error("Email, OTP, and ID are required");
    }

    const payload = {
      email,
      otp,
      id
    };

    const response = await api.post(url, payload);

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to verify OTP");
    }

    return response;
  } catch (error: any) {
    console.error("apiVerifyEmailOtp error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to verify OTP. Please try again."
    );
  }
}

export async function apiGoogleSSO(token: string) {
  const url = `${BASE_URL}/googleauth`;
  try {
    const payload = {
      token,
      userType: "2"
    };

    const response = await api.post(url, payload);

    if (response.status !== 200) {
      throw new Error(response.data?.message || "Failed to authenticate with Google");
    }

    return response;
  } catch (error: any) {
    console.error("apiGoogleSSO error:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to authenticate with Google. Please try again."
    );
  }
}

export const uploadVideo = (formData: FormData, token: string) => {
  return api.post(`${BASE_URL}/api/uploadshot`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};