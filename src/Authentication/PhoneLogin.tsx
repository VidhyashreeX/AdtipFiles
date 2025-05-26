import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PhoneLogin: React.FC = () => {
  const navigate = useNavigate();

  // State for phone OTP login
  const [countryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');
  const [timer, setTimer] = useState<number>(40);
  const [getOtpLoading, setGetOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  // State for username/password login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // State for user details
  const [name, setName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [isSaveUserDetails, setIsSaveUserDetails] = useState<number>(0);

  // State for location
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [pincode, setPincode] = useState<string>('');
  const [geoLocationLoading, setGeoLocationLoading] = useState<boolean>(false);

  const BASE_URL = 'https://your-api-url.com/';

  // Check if user is logged in on mount
  useEffect(() => {
    const checkIfUserLoggedIn = () => {
      const savedToken = localStorage.getItem('UserLoggedIn');
      const savedUserId = localStorage.getItem('UserId');
      if (savedToken && savedUserId) {
        setToken(savedToken);
        setUserId(Number(savedUserId));
        setIsUserLoggedIn(true);
        setName(localStorage.getItem('name') || '');
        setProfileImage(localStorage.getItem('profileImage') || '');
      }
    };
    checkIfUserLoggedIn();
  }, []);

  // Timer for OTP resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Get current location
  const getLocationData = async () => {
    try {
      setGeoLocationLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLatitude(latitude);
            setLongitude(longitude);

            // Use Nominatim for reverse geocoding
            try {
              const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const postalCode = response.data.address.postcode || '';
              setPincode(postalCode);
            } catch (error) {
              console.error('Error fetching pincode:', error);
            }

            // Check user details and redirect
            await checkUserDetailsAndRedirect();
            setGeoLocationLoading(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setGeoLocationLoading(false);
            alert('Location permission denied');
          },
          { enableHighAccuracy: true }
        );
      } else {
        setGeoLocationLoading(false);
        alert('Geolocation not supported');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setGeoLocationLoading(false);
    }
  };

  // Send OTP
  const sendOTP = async () => {
    try {
      setGetOtpLoading(true);
      const response = await axios.post(`${BASE_URL}otplogin`, {
        mobileNumber: phone,
        userType: '2',
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        const userData = response.data.data[0];
        // Store for OTPVerification
        localStorage.setItem('mobile_number', phone);
        localStorage.setItem('tempUserId', String(userData.id));
        localStorage.setItem('otpCountdown', (Math.floor(Date.now() / 1000) + 30).toString());
        setUserId(userData.id);
        setTimer(40);
        // Redirect to OTP verification
        navigate('/verify-otp');
      } else {
        alert(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setGetOtpLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!userId) return;
    try {
      setVerifyOtpLoading(true);
      const response = await axios.post(`${BASE_URL}otpverify`, {
        id: userId,
        otp,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        const data = response.data.data[0];
        const accessToken = response.data.accessToken;
        setIsSaveUserDetails(data.isSaveUserDetails || 0);
        setToken(accessToken);
        setUserId(data.id);
        setName(data.name || '');
        setProfileImage(data.profileImage || '');

        // Save to localStorage
        localStorage.setItem('UserLoggedIn', accessToken);
        localStorage.setItem('UserId', String(data.id));
        localStorage.setItem('name', data.name || '');
        localStorage.setItem('profileImage', data.profile_image || '');
        localStorage.setItem('gender', data.gender || '');
        localStorage.setItem('profession', data.profession || '');
        localStorage.setItem('maritalStatus', data.maternal_status || '');
        localStorage.setItem('age', data.dob || '');

        setIsUserLoggedIn(true);
        await checkUserDetailsAndRedirect();
      } else {
        alert(response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to verify OTP');
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  // Username/Password Login
  const login = async () => {
    try {
      setLoginLoading(true);
      const response = await axios.post(`${BASE_URL}login`, {
        username,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        const data = response.data.data[0];
        const accessToken = response.data.accessToken;
        setIsSaveUserDetails(data.isSaveUserDetails || 0);
        setToken(accessToken);
        setUserId(data.id);
        setName(data.name || '');
        setProfileImage(data.profileImage || '');

        // Save to localStorage
        localStorage.setItem('UserLoggedIn', accessToken);
        localStorage.setItem('UserId', String(data.id));
        localStorage.setItem('name', data.name || '');
        localStorage.setItem('profileImage', data.profile_image || '');
        localStorage.setItem('gender', data.gender || '');
        localStorage.setItem('profession', data.profession || '');
        localStorage.setItem('maritalStatus', data.maternal_status || '');
        localStorage.setItem('age', data.dob || '');

        setIsUserLoggedIn(true);
        await checkUserDetailsAndRedirect();
      } else {
        alert(response.data.message || 'Failed to login');
      }
    } catch (error) {
      console.error(error);
      alert('Invalid username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      const response = await axios.post(`${BASE_URL}logout`, {
        id: userId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        // Clear localStorage
        localStorage.clear();
        // Reset state
        setPhone('');
        setOtp('');
        setUsername('');
        setPassword('');
        setUserId(null);
        setToken('');
        setName('');
        setProfileImage('');
        setTimer(40);
        setIsUserLoggedIn(false);
        navigate('/');
        alert('Logged out successfully');
      } else {
        alert(response.data.message || 'Failed to logout');
      }
    } catch (error) {
      console.error(error);
      alert('Error during logout');
    }
  };

  // Check user details and redirect
  const checkUserDetailsAndRedirect = async () => {
    const fields = ['name', 'age', 'gender', 'profession', 'maritalStatus'];
    if (isSaveUserDetails === 1 && fields.every(field => localStorage.getItem(field))) {
      localStorage.setItem('UserId', String(userId));
      localStorage.setItem('UserLoggedIn', token);
      localStorage.setItem('name', name);
      localStorage.setItem('profileImage', profileImage);
      navigate('/dashboard');
    } else {
      const missing = fields.find(field => !localStorage.getItem(field));
      if (missing) {
        navigate(`/enter-${missing.toLowerCase()}`);
      } else {
        navigate('/enable-location');
      }
    }
  };

  // Save user details (placeholder for profile setup)
  const saveUserDetails = async () => {
    try {
      const response = await axios.post(`${BASE_URL}saveuserdetails`, {
        id: userId,
        name: localStorage.getItem('name') || '',
        gender: localStorage.getItem('gender') || '',
        dob: localStorage.getItem('age') || '',
        profession: localStorage.getItem('profession') || '',
        emailId: localStorage.getItem('email_address') || '',
        profile_image: profileImage,
        maternal_status: localStorage.getItem('maritalStatus') || '',
        address: localStorage.getItem('selected_address') || '',
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        pincode,
        languages: localStorage.getItem('languages') ? JSON.parse(localStorage.getItem('languages')!) : [],
        interests: localStorage.getItem('interests') ? JSON.parse(localStorage.getItem('interests')!) : [],
        referral_code: localStorage.getItem('referral_code') || '',
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        localStorage.setItem('UserId', String(response.data.data[0].id));
        localStorage.setItem('UserLoggedIn', token);
        localStorage.setItem('name', name);
        localStorage.setItem('profileImage', profileImage);
        alert('Account created successfully');
        navigate('/dashboard');
        // Clear localStorage keys
        localStorage.removeItem('name');
        localStorage.removeItem('gender');
        localStorage.removeItem('age');
        localStorage.removeItem('profession');
        localStorage.removeItem('maritalStatus');
        localStorage.removeItem('latitude');
        localStorage.removeItem('longitude');
        localStorage.removeItem('selected_address');
        localStorage.removeItem('referral_code');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving user details');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Login</h2>

      <h3 className="text-lg mb-2">Phone OTP Login</h3>
      <input
        type="text"
        placeholder="Enter Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />
      <button
        onClick={sendOTP}
        disabled={getOtpLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:bg-blue-300"
      >
        {getOtpLoading ? 'Sending...' : 'Send OTP'}
      </button>

      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />
      <button
        onClick={verifyOTP}
        disabled={verifyOtpLoading}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4 disabled:bg-green-300"
      >
        {verifyOtpLoading ? 'Verifying...' : 'Verify OTP'}
      </button>

      {timer > 0 && <p className="mt-2 text-gray-500 mb-4">Resend OTP in {timer}s</p>}

      <hr className="my-6" />

      <h3 className="text-lg mb-2">Username/Password Login</h3>
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />
      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />
      <button
        onClick={login}
        disabled={loginLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 disabled:bg-blue-400"
      >
        {loginLoading ? 'Logging in...' : 'Login'}
      </button>

      <hr className="my-6" />

      <button
        onClick={getLocationData}
        disabled={geoLocationLoading}
        className="bg-purple-500 text-white px-4 py-2 rounded mb-4 disabled:bg-purple-300"
      >
        {geoLocationLoading ? 'Fetching Location...' : 'Get Location'}
      </button>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default PhoneLogin;