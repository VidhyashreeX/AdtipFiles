// src/utils/userDataUtils.ts
import { ComprehensiveUserData } from '../types/api';

/**
 * Utility functions for common user data operations
 */

/**
 * Check if user has premium status
 */
export const isPremiumUser = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData) return false;
  return userData.is_premium === 1;
};

/**
 * Check if user has content creator premium status
 */
export const isContentCreatorPremium = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData) return false;
  return userData.content_creator_premium_status === 1;
};

/**
 * Check if premium subscription is expired
 */
export const isPremiumExpired = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData || !userData.premium_expires_at) return true;
  
  const expiryDate = new Date(userData.premium_expires_at);
  const now = new Date();
  return expiryDate < now;
};

/**
 * Get premium expiry date as formatted string
 */
export const getPremiumExpiryDate = (userData: ComprehensiveUserData | null): string | null => {
  if (!userData || !userData.premium_expires_at) return null;
  
  try {
    const expiryDate = new Date(userData.premium_expires_at);
    return expiryDate.toLocaleDateString();
  } catch {
    return null;
  }
};

/**
 * Get days until premium expires
 */
export const getDaysUntilPremiumExpiry = (userData: ComprehensiveUserData | null): number | null => {
  if (!userData || !userData.premium_expires_at) return null;
  
  try {
    const expiryDate = new Date(userData.premium_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
};

/**
 * Check if user is a first-time user
 */
export const isFirstTimeUser = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData) return false;
  return userData.is_first_time === 1;
};

/**
 * Check if user has completed profile setup
 */
export const hasCompletedProfile = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData) return false;
  return userData.isSaveUserDetails === 1;
};

/**
 * Get user's full name
 */
export const getUserFullName = (userData: ComprehensiveUserData | null): string => {
  if (!userData) return '';
  
  const firstName = userData.firstName || '';
  const lastName = userData.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  return userData.name || '';
};

/**
 * Get user's display name (prioritizes full name, falls back to username)
 */
export const getUserDisplayName = (userData: ComprehensiveUserData | null): string => {
  if (!userData) return 'Unknown User';
  
  const fullName = getUserFullName(userData);
  if (fullName) return fullName;
  
  return userData.username || userData.name || 'Unknown User';
};

/**
 * Get user's profile image URL with fallback
 */
export const getUserProfileImage = (userData: ComprehensiveUserData | null): string | null => {
  if (!userData || !userData.profile_image) return null;
  
  // Ensure the URL is valid
  try {
    new URL(userData.profile_image);
    return userData.profile_image;
  } catch {
    return null;
  }
};

/**
 * Format user's wallet balance
 */
export const formatWalletBalance = (userData: ComprehensiveUserData | null): string => {
  if (!userData) return '₹0.00';
  
  const balance = userData.referal_earnings || 0;
  return `₹${balance.toFixed(2)}`;
};

/**
 * Get user's total withdrawals
 */
export const getTotalWithdrawals = (userData: ComprehensiveUserData | null): number => {
  if (!userData) return 0;
  return userData.total_withdrawals || 0;
};

/**
 * Format user's mobile number
 */
export const formatMobileNumber = (userData: ComprehensiveUserData | null): string => {
  if (!userData || !userData.mobile_number) return '';
  
  const countryCode = userData.country_code || '+91';
  const mobile = userData.mobile_number;
  
  // If mobile already includes country code, return as is
  if (mobile.startsWith('+') || mobile.startsWith(countryCode.replace('+', ''))) {
    return mobile;
  }
  
  return `${countryCode} ${mobile}`;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData) return false;
  return userData.online_status === 1;
};

/**
 * Check if user is available for calls
 */
export const isUserAvailable = (userData: ComprehensiveUserData | null): boolean => {
  if (!userData) return false;
  return userData.is_available === 1 && userData.dnd === 0;
};

/**
 * Get user's location string
 */
export const getUserLocation = (userData: ComprehensiveUserData | null): string => {
  if (!userData || !userData.address) return '';
  return userData.address;
};

/**
 * Get user's age from date of birth
 */
export const getUserAge = (userData: ComprehensiveUserData | null): number | null => {
  if (!userData || !userData.dob) return null;
  
  try {
    // Assuming dob is in format "DD" or "DD/MM/YYYY" or similar
    // This is a simplified implementation - you might need to adjust based on actual format
    const dobStr = userData.dob;
    if (dobStr.length <= 2) {
      // Only day provided, can't calculate age
      return null;
    }
    
    const dobDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    
    return age > 0 ? age : null;
  } catch {
    return null;
  }
};

/**
 * Validate user data integrity
 */
export const validateUserData = (userData: ComprehensiveUserData | null): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!userData) {
    return { isValid: false, errors: ['User data is null or undefined'] };
  }
  
  // Required fields validation
  if (!userData.id) errors.push('User ID is missing');
  if (!userData.name) errors.push('User name is missing');
  if (!userData.mobile_number) errors.push('Mobile number is missing');
  
  // Email validation
  if (userData.emailId && !isValidEmail(userData.emailId)) {
    errors.push('Invalid email format');
  }
  
  // Premium data consistency
  if (userData.is_premium === 1 && !userData.premium_expires_at) {
    errors.push('Premium user missing expiry date');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get user's referral information
 */
export const getUserReferralInfo = (userData: ComprehensiveUserData | null) => {
  if (!userData) {
    return {
      referralCode: '',
      referralEarnings: 0,
      referredCount: 0,
      referredBy: null,
    };
  }
  
  return {
    referralCode: userData.referal_code || '',
    referralEarnings: userData.referal_earnings || 0,
    referredCount: userData.referred_count || 0,
    referredBy: userData.referred_by,
  };
};

/**
 * Check if user can withdraw money
 */
export const canUserWithdraw = (userData: ComprehensiveUserData | null, minimumAmount: number = 100): boolean => {
  if (!userData) return false;
  
  const balance = userData.referal_earnings || 0;
  return balance >= minimumAmount;
};

/**
 * Get user's account creation date
 */
export const getUserCreationDate = (userData: ComprehensiveUserData | null): Date | null => {
  if (!userData || !userData.created_date) return null;
  
  try {
    return new Date(userData.created_date);
  } catch {
    return null;
  }
};

/**
 * Get user's last update date
 */
export const getUserLastUpdateDate = (userData: ComprehensiveUserData | null): Date | null => {
  if (!userData || !userData.updated_date) return null;
  
  try {
    return new Date(userData.updated_date);
  } catch {
    return null;
  }
};

/**
 * Create a summary object with commonly used user information
 */
export const createUserSummary = (userData: ComprehensiveUserData | null) => {
  return {
    id: userData?.id || 0,
    displayName: getUserDisplayName(userData),
    profileImage: getUserProfileImage(userData),
    isPremium: isPremiumUser(userData),
    isContentCreator: isContentCreatorPremium(userData),
    walletBalance: formatWalletBalance(userData),
    isOnline: isUserOnline(userData),
    isAvailable: isUserAvailable(userData),
    location: getUserLocation(userData),
    mobileNumber: formatMobileNumber(userData),
    hasCompletedProfile: hasCompletedProfile(userData),
    isFirstTime: isFirstTimeUser(userData),
    referralInfo: getUserReferralInfo(userData),
  };
};
