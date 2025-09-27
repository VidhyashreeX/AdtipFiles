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
    // Enhanced detailed error logging
    if (error.response) {
      console.error('API Error Response:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        method: error.config?.method,
        headers: error.config?.headers,
        timestamp: new Date().toISOString()
      });
      
      // Log any specific error messages from server
      if (error.response.data?.message) {
        console.error('Server error message:', error.response.data.message);
      }
      
      // Log detailed validation errors if available
      if (error.response.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    } else if (error.request) {
      console.error('API Request Error (No Response):', {
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('API Setup Error:', {
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
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

  const sanitizeText = (value: any, fallback = ''): string => {
    if (value === undefined || value === null) {
      return fallback;
    }
    const text = String(value).trim();
    if (!text) {
      return fallback;
    }
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, ' ');
  };

  const toIntSafe = (value: any, fallback = 0): number => {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toFloatSafe = (value: any, fallback = 0): number => {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toCsv = (value: any): string => {
    if (Array.isArray(value)) {
      return value
        .filter((item) => item !== undefined && item !== null && String(item).trim() !== '')
        .map((item) => sanitizeText(item))
        .join(',');
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => sanitizeText(item))
        .filter((item) => item !== '')
        .join(',');
    }
    return '';
  };

  try {
    const normalizedImages = toCsv(
      productData.images ?? productData.product_images ?? productData.primary_image ?? ''
    );

    const normalizedData: Record<string, any> = {
      name: sanitizeText(productData.name),
      description: sanitizeText(productData.description ?? productData.product_description),
      brand: sanitizeText(
        productData.brand ?? productData.brandName ?? productData.brand_name ?? ''
      ),
      categoryId: toIntSafe(
        productData.categoryId ?? productData.category_id ?? productData.category
      ),
      deliveryTime: sanitizeText(
        productData.deliveryTime ?? productData.delivery_time ?? '1-2 days'
      ),
      units: toIntSafe(
        productData.units ?? productData.stock ?? productData.unitsAvailable,
        1
      ),
      regularPrice: toFloatSafe(productData.regularPrice ?? productData.your_price ?? 0, 0),
      marketPrice: toFloatSafe(
        productData.marketPrice ?? productData.regularPrice ?? productData.your_price ?? 0,
        0
      ),
      size: sanitizeText(
        productData.size ??
          (Array.isArray(productData.sizeOptions)
            ? productData.sizeOptions.join(',')
            : productData.sizeOptions ?? ''),
        ''
      ),
      images: normalizedImages,
      companyId: toIntSafe(productData.companyId ?? productData.company_id),
      deliveryType: sanitizeText(
        productData.deliveryType ?? productData.delivery_type ?? 'Standard'
      ),
      termsApply: sanitizeText(
        productData.termsApply ?? productData.terms_condition ?? 'Standard terms and conditions apply'
      ),
      created_by: toIntSafe(
        productData.created_by ?? productData.createdBy ?? productData.userId
      ),
      your_price: toFloatSafe(
        productData.your_price ?? productData.regularPrice ?? productData.marketPrice ?? 0,
        0
      ),
      keyword: sanitizeText(
        productData.keyword ??
          (productData.name ? String(productData.name).toLowerCase().replace(/\s+/g, ',') : '')
      ),
      manufacturer_date: sanitizeText(
        productData.manufacturer_date ??
          productData.manufacturerDate ??
          new Date().toISOString().split('T')[0]
      ),
      product_description: sanitizeText(
        productData.product_description ?? productData.description
      ),
      product_specification: sanitizeText(
        productData.product_specification ??
          (() => {
            const weight = String(productData.weight ?? '0').trim() || '0';
            const dimensions = String(productData.dimensions ?? 'N/A').trim() || 'N/A';
            return `Weight: ${weight}kg, Dimensions: ${dimensions}`;
          })()
      ),
      inches: toFloatSafe(productData.inches ?? 0, 0),
      additional_accessories: sanitizeText(
        productData.additional_accessories ?? ''
      ),
      stock: toIntSafe(
        productData.stock ?? productData.units ?? productData.unitsAvailable,
        1
      ),
      procurement_type: sanitizeText(productData.procurement_type ?? 'Direct'),
      procurement_time: toIntSafe(productData.procurement_time ?? 1, 1),
      shipping_fee: toFloatSafe(productData.shipping_fee ?? 0, 0),
      replacement_days: toIntSafe(productData.replacement_days ?? 7, 7),
      warranty_days: toIntSafe(productData.warranty_days ?? 30, 30),
      sku_id: sanitizeText(productData.sku_id ?? productData.skuId ?? `SKU-${Date.now()}`),
      auto_bargain: toIntSafe(productData.auto_bargain ?? 0, 0),
      bargain_minimum_price: toFloatSafe(
        productData.bargain_minimum_price ??
          (productData.regularPrice ? Number(productData.regularPrice) * 0.9 : 0),
        0
      ),
      primary_image: sanitizeText(
        productData.primary_image ?? normalizedImages.split(',')[0] ?? ''
      ),
    };

    const requiredFields: Array<keyof typeof normalizedData> = [
      'name',
      'description',
      'brand',
      'categoryId',
      'companyId',
      'created_by',
      'images',
      'regularPrice'
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = normalizedData[field];
      if (typeof value === 'number') {
        if (field === 'regularPrice') {
          return value <= 0;
        }
        return value <= 0;
      }
      return !value;
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required product data: ${missingFields.join(', ')}`
      );
    }

    const payloadFields = [
      'name',
      'description',
      'brand',
      'categoryId',
      'deliveryTime',
      'units',
      'regularPrice',
      'marketPrice',
      'size',
      'images',
      'companyId',
      'deliveryType',
      'termsApply',
      'created_by',
      'your_price',
      'keyword',
      'manufacturer_date',
      'product_description',
      'product_specification',
      'inches',
      'additional_accessories',
      'stock',
      'procurement_type',
      'procurement_time',
      'shipping_fee',
      'replacement_days',
      'warranty_days',
      'sku_id',
      'auto_bargain',
      'bargain_minimum_price',
      'primary_image'
    ] as const;

    const payload: Record<string, any> = {};
    payloadFields.forEach((field) => {
      payload[field] = normalizedData[field];
    });

    console.log('apiAddProduct request:', {
      url: `${BASE_URL}/api/addproduct`,
      token: token ? 'Present' : 'Missing',
      fieldCount: Object.keys(payload).length,
      fields: Object.keys(payload),
      data: {
        ...payload,
        images: payload.images ? 'Present' : 'Missing',
        primary_image: payload.primary_image ? 'Present' : 'Missing'
      }
    });

    return await axios.post(`${BASE_URL}/api/addproduct`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error('apiAddProduct error:', {
      message: error.message,
      status: error.response?.status,
      data: errorData,
      sqlError: errorData?.sqlMessage || errorData?.message,
      payload: productData
    });

    if (errorData?.sqlMessage && errorData.sqlMessage.includes('Unknown column')) {
      console.error('SQL COLUMN ERROR: Backend schema mismatch suspected.');
    }

    throw error;
  }
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
  
  try {
    const sanitizeText = (value: any, fallback = ''): string => {
      if (value === undefined || value === null) {
        return fallback;
      }
      const text = String(value).trim();
      if (!text) {
        return fallback;
      }
      return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\r?\n/g, ' ');
    };

    const toIntSafe = (value: any, fallback = 0): number => {
      const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const normalizedData: Record<string, any> = {
      company_id: toIntSafe(postData.company_id ?? postData.companyId),
      createdby: toIntSafe(postData.createdby ?? postData.createdBy ?? postData.userId),
      PostName: sanitizeText(postData.PostName ?? postData.title),
      PostDescription: sanitizeText(postData.PostDescription ?? postData.description),
      buttonid: toIntSafe(postData.buttonid ?? postData.buttonId ?? 0, 0),
      website: sanitizeText(postData.website ?? postData.websiteLink ?? ''),
      image_path: sanitizeText(postData.image_path ?? postData.postImage ?? ''),
      custom_button_label: sanitizeText(postData.customButton ?? ''),
      id: toIntSafe(postData.id ?? 0, 0)
    };

    const requiredFields: Array<keyof typeof normalizedData> = [
      'company_id',
      'createdby',
      'PostName',
      'PostDescription'
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = normalizedData[field];
      if (typeof value === 'number') {
        return value <= 0;
      }
      return !value;
    });

    if (missingFields.length) {
      throw new Error(`Missing required post data: ${missingFields.join(', ')}`);
    }

    // Use default button id if none provided
    if (!normalizedData.buttonid || normalizedData.buttonid < 0) {
      normalizedData.buttonid = 0;
    }

    const payload: Record<string, any> = {
      PostName: normalizedData.PostName,
      PostDescription: normalizedData.PostDescription,
      buttonid: normalizedData.buttonid,
      website: normalizedData.website,
      image_path: normalizedData.image_path,
      createdby: normalizedData.createdby,
      company_id: normalizedData.company_id
    };

    if (normalizedData.id > 0) {
      payload.id = normalizedData.id;
    }

    if (normalizedData.custom_button_label) {
      payload.custom_button_label = normalizedData.custom_button_label;
    }

    console.log('apiSavePost request:', {
      url: `${BASE_URL}/api/savepost`,
      token: token ? 'Present' : 'Missing',
      fieldCount: Object.keys(payload).length,
      fields: Object.keys(payload),
      data: {
        ...payload,
        image_path: payload.image_path ? 'Present' : 'Missing'
      }
    });

    return await axios.post(`${BASE_URL}/api/savepost`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Add timeout to prevent long-hanging requests
      timeout: 15000
    });
  } catch (error: any) {
    // Enhanced error handling with SQL error diagnosis
    const errorData = error.response?.data;
    console.error('apiSavePost error:', {
      message: error.message,
      status: error.response?.status,
      data: errorData,
      sqlError: errorData?.sqlMessage || errorData?.message,
      requiredFields: ['PostName', 'PostDescription', 'company_id', 'createdby'],
    });
    
    // Special handling for SQL column errors
    if (errorData?.sqlMessage && errorData.sqlMessage.includes('Unknown column')) {
      console.error('SQL COLUMN ERROR: The backend database schema might not match the mapped fields');
      console.error('Original frontend fields:', Object.keys(postData));
      console.error('Mapped backend fields were sent to API');
    }
    
    throw error;
  }
};

type TogglePostLikePayload = {
  postId: number | string;
  userId: number | string;
  isLiked: boolean;
};

export const apiTogglePostLike = async ({ postId, userId, isLiked }: TogglePostLikePayload) => {
  const token = localStorage.getItem('UserLoggedIn');

  if (!token) {
    throw new Error('User is not authenticated');
  }

  return axios.post(
    `${BASE_URL}/api/save-user-post-like`,
    {
      postId: Number(postId),
      userId: Number(userId),
      is_liked: isLiked ? 1 : 0
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
};

type AddPostCommentPayload = {
  postId: number | string;
  userId: number | string;
  comment: string;
};

export const apiAddPostComment = async ({ postId, userId, comment }: AddPostCommentPayload) => {
  const token = localStorage.getItem('UserLoggedIn');

  if (!token) {
    throw new Error('User is not authenticated');
  }

  const sanitizeComment = (value: string) =>
    value
      .trim()
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, ' ');

  return axios.post(
    `${BASE_URL}/api/save-user-post-comment`,
    {
      postId: Number(postId),
      userId: Number(userId),
      comment: sanitizeComment(comment)
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
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