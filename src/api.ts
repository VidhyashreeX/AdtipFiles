import axios from "axios";

// Use environment variable for API base URL
//const BASE_URL = 'http://localhost:7082';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

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

// Company Registration API
export const apiCreateCompany = async (companyData: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  
  // Try multiple localStorage keys to find user data
  let userData = {};
  try {
    userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !(userData as any).id) {
      userData = JSON.parse(localStorage.getItem('UserData') || '{}');
    }
    if (!userData || !(userData as any).id) {
      userData = JSON.parse(localStorage.getItem('userData') || '{}');
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
    userData = {};
  }

  // Ensure we have a valid user ID
  const userId = (userData as any).id;
  if (!userId) {
    throw new Error('User not logged in. Please log in again and try registering your company.');
  }

  // Create unique company name to avoid duplicate entry errors
  const baseCompanyName = companyData.companyName || '';
  const timestamp = Date.now();
  
  // Create JSON payload for the new createCompany endpoint
  const payload = {
    createdby: userId,
    name: baseCompanyName,
    email: companyData.email || '',
    phone: companyData.phone || '',
    location: companyData.location || '',
    about: companyData.description || '',
    website: companyData.website || '',
    industry: companyData.companyType || 'Products',
    button: companyData.ctaButton || 'Know More',
    // Send URLs directly - these will be stored as strings in the database
    profileimage: companyData.logoUrl || '', // Logo URL
    coverimage: companyData.bannerUrl || ''   // Banner URL
  };

  console.log('=== COMPANY REGISTRATION DEBUG ===');
  console.log('User ID found:', userId);
  console.log('Company Name:', baseCompanyName);
  console.log('Token present:', !!token);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('====================================');

  try {
    const response = await axios.post(`${BASE_URL}/api/registercompany`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response;
  } catch (error: any) {
    console.error('Company registration error:', error);
    
    // Handle duplicate entry error by adding timestamp to name
    if (error.response?.data?.message?.includes('ER_DUP_ENTRY') || 
        error.response?.data?.message?.includes('Duplicate entry') ||
        error.response?.data?.message?.includes('unique_comany_user_id')) {
      
      console.log('Duplicate entry detected, retrying with unique name...');
      const uniqueName = `${baseCompanyName}_${timestamp}`;
      const retryPayload = { ...payload, name: uniqueName };
      
      console.log('Retrying with unique name:', uniqueName);
      return axios.post(`${BASE_URL}/api/registercompany`, retryPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    throw error;
  }
};

// Check if company name exists
export const apiCheckCompanyNameExists = async (companyName: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/checkcompanynameexist/${encodeURIComponent(companyName)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Ad Model APIs
export const apiGetAdModels = async () => {
  return axios.get(`${BASE_URL}/api/getadmodels`);
};

export const apiGetTargetAreas = async () => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/gettargetareas`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const apiGetTargetProfessions = async () => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/gettargetprofession`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const apiGetButtons = async () => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getbuttons`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Ad Campaign Creation APIs - First Page
export const apiSaveFirstPageAdModel = async (adData: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.post(`${BASE_URL}/api/savefirstpageadmodel`, adData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Ad Campaign Creation APIs - Second Page (with media upload)
export const apiSaveSecondPageAdModel = async (adData: any, mediaFile?: File) => {
  const token = localStorage.getItem('UserLoggedIn');
  const formData = new FormData();
  
  // Add all ad data fields
  Object.entries(adData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value.toString());
    }
  });

  // Add media file if provided
  if (mediaFile) {
    formData.append('adFile', mediaFile);
  }

  return axios.post(`${BASE_URL}/api/savesecondpageadmodel`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Ad Campaign Creation APIs - Third Page
export const apiSaveThirdPageAdModel = async (adData: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.post(`${BASE_URL}/api/savethirdpageadmodel`, adData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Get user's ads
export const apiGetUserAds = async (userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getalladds/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

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
  const url = `${BASE_URL}/api/saveuserdetails`;
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
  const url = `${BASE_URL}/api/emailotp`;
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
  const url = `${BASE_URL}/api/emailotpverify`;
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
  const url = `${BASE_URL}/api/googleauth`;
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
  return api.post(`${BASE_URL}/api/uploadcontent`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// ============== SELLER DASHBOARD APIs ==============

// Get all companies for a user (seller's companies)
export const apiGetCompanyList = async (userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getcompanylist/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get all companies in the system (for discovery)
export const apiGetAllCompanyList = async (userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getallcompanylist/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get specific company details
export const apiGetCompany = async (companyId: string, userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getcompany/${companyId}/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Update company details
export const apiUpdateCompany = async (companyData: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  const formData = new FormData();
  
  // Add all fields to FormData
  Object.keys(companyData).forEach(key => {
    if (companyData[key] !== null && companyData[key] !== undefined) {
      formData.append(key, companyData[key]);
    }
  });

  return axios.post(`${BASE_URL}/api/updatecompany`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Get products for a company
export const apiGetProductList = async (companyId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getProductlist/${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get all products
export const apiGetAllProducts = async () => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getallproduct`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Add new product
export const apiAddProduct = async (productData: any) => {
  const token = localStorage.getItem('UserLoggedIn');

  return axios.post(`${BASE_URL}/api/addproduct`, productData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Update product
export const apiUpdateProduct = async (productData: any) => {
  const token = localStorage.getItem('UserLoggedIn');

  return axios.post(`${BASE_URL}/api/updateproduct`, productData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Delete product
export const apiDeleteProduct = async (productData: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.post(`${BASE_URL}/api/deleteProduct`, productData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Get company posts
export const apiGetCompanyPost = async (companyId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getcompanypost/${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const apiGetCompanyButtons = async () => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getCompanyButton`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Save company post
export const apiSavePost = async (postData: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.post(`${BASE_URL}/api/savepost`, postData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const apiGetProductDetails = async (productId: string | number, userId: string | number) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/productbyproductid/${productId}/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const apiSaveProductDetails = async (details: any) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.post(`${BASE_URL}/api/savevproductsdetails`, details, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Get seller orders
export const apiGetSellerOrders = async (userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getSellerOrders/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get user orders
export const apiGetUserOrders = async (userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getUserOrders/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get recent ads by company
export const apiGetRecentAdsByCompany = async (companyId: string, userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getLastaddetails/${companyId}/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get company ads (seller's ads)
export const apiGetSellerAds = async (userId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  return axios.get(`${BASE_URL}/api/getAdvModel/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get company reviews (mock for now - create this endpoint in backend)
export const apiGetCompanyReviews = async (companyId: string) => {
  const token = localStorage.getItem('UserLoggedIn');
  // This is a mock API call since the reviews endpoint doesn't exist yet
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          status: 200,
          data: [
            { id: 1, name: 'Sarah Johnson', rating: 5, comment: 'Excellent service and great results!', date: '2024-01-15' },
            { id: 2, name: 'Mike Chen', rating: 5, comment: 'Very professional and effective campaigns.', date: '2024-01-12' },
            { id: 3, name: 'Lisa Davis', rating: 4, comment: 'Good experience overall, would recommend.', date: '2024-01-10' }
          ]
        }
      });
    }, 500);
  });
};