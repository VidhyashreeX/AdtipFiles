/**
 * Time utility functions for formatting relative time
 */

/**
 * Converts a date string to a human-readable "time ago" format
 * @param dateString - Date string in ISO format or any valid date format
 * @returns String representing time elapsed (e.g., "2 hours ago", "3 days ago")
 */
export const getTimeAgo = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle future dates
    if (diffInSeconds < 0) {
      return 'Just now';
    }
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than a month
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
    
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'Unknown time';
  }
};

/**
 * Formats a date to a short readable format
 * @param dateString - Date string in ISO format or any valid date format
 * @returns String in format "Jan 15, 2024"
 */
export const formatShortDate = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a date to a full readable format with time
 * @param dateString - Date string in ISO format or any valid date format
 * @returns String in format "January 15, 2024 at 3:30 PM"
 */
export const formatFullDateTime = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('en-US', options).replace(' at ', ' at ');
  } catch (error) {
    console.error('Error formatting full date time:', error);
    return 'Invalid date';
  }
};

/**
 * Checks if a date is today
 * @param dateString - Date string in ISO format or any valid date format
 * @returns Boolean indicating if the date is today
 */
export const isToday = (dateString: string | Date): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Checks if a date is yesterday
 * @param dateString - Date string in ISO format or any valid date format
 * @returns Boolean indicating if the date is yesterday
 */
export const isYesterday = (dateString: string | Date): boolean => {
  try {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.toDateString() === yesterday.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Gets a smart time format based on how recent the date is
 * @param dateString - Date string in ISO format or any valid date format
 * @returns String with appropriate time format
 */
export const getSmartTimeFormat = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return formatShortDate(date);
  } catch (error) {
    console.error('Error getting smart time format:', error);
    return 'Invalid date';
  }
};
