// Date utility functions for premium expiry formatting

/**
 * Formats a date string to DD MM YYYY format
 * @param dateString - Date string in format "2025-12-21 01:31:43" or ISO format
 * @returns Formatted date string in "21 Dec 2025" format
 */
export const formatPremiumExpiryDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting premium expiry date:', error);
    return 'Invalid Date';
  }
};

/**
 * Checks if a premium plan is expiring soon (within 7 days)
 * @param dateString - Date string in format "2025-12-21 01:31:43" or ISO format
 * @returns boolean indicating if expiring soon
 */
export const isPremiumExpiringSoon = (dateString: string): boolean => {
  try {
    const expiryDate = new Date(dateString);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Checks if a premium plan has expired
 * @param dateString - Date string in format "2025-12-21 01:31:43" or ISO format
 * @returns boolean indicating if expired
 */
export const isPremiumExpired = (dateString: string): boolean => {
  try {
    const expiryDate = new Date(dateString);
    const now = new Date();
    
    return expiryDate.getTime() < now.getTime();
  } catch (error) {
    return false;
  }
};
