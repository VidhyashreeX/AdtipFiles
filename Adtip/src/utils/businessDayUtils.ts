// src/utils/businessDayUtils.ts
// Utility functions for business day calculations and earnings timeline

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Check if a date is a holiday (Indian holidays)
 * This is a basic implementation - in production, you'd want to use a more comprehensive holiday API
 */
export const isHoliday = (date: Date): boolean => {
  // Basic Indian holidays (you can expand this list)
  const holidays = [
    '01-26', // Republic Day
    '08-15', // Independence Day
    '10-02', // Gandhi Jayanti
    '12-25', // Christmas
  ];
  
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return holidays.includes(monthDay);
};

/**
 * Check if a date is a business day (not weekend and not holiday)
 */
export const isBusinessDay = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};

/**
 * Add business days to a date
 */
export const addBusinessDays = (startDate: Date, businessDays: number): Date => {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      daysAdded++;
    }
  }
  
  return result;
};

/**
 * Calculate business days between two dates
 */
export const getBusinessDaysBetween = (startDate: Date, endDate: Date): number => {
  let businessDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
};

/**
 * Get earnings credit timeline based on user premium status
 */
export const getEarningsCreditTimeline = (isPremium: boolean, earningDate: Date = new Date()) => {
  const processingDays = isPremium ? 5 : 21; // Premium: 5 days, Non-premium: 21 days
  const creditDate = addBusinessDays(earningDate, processingDays);
  
  return {
    earningDate,
    creditDate,
    processingDays,
    isPremium,
    businessDaysRemaining: Math.max(0, getBusinessDaysBetween(new Date(), creditDate)),
    isCreditable: new Date() >= creditDate,
    timeline: generateTimelineSteps(earningDate, creditDate, isPremium)
  };
};

/**
 * Generate timeline steps for earnings credit process
 */
export const generateTimelineSteps = (earningDate: Date, creditDate: Date, isPremium: boolean) => {
  const now = new Date();
  const processingDays = isPremium ? 5 : 21;
  
  return [
    {
      id: 'earned',
      title: 'Earnings Recorded',
      description: 'Your earnings have been recorded in the system',
      date: earningDate,
      completed: true,
      current: false,
      icon: 'dollar-sign'
    },
    {
      id: 'processing',
      title: 'Processing',
      description: `Processing earnings (${processingDays} business days for ${isPremium ? 'premium' : 'regular'} users)`,
      date: null,
      completed: now > earningDate,
      current: now > earningDate && now < creditDate,
      icon: 'clock'
    },
    {
      id: 'credited',
      title: 'Available for Withdrawal',
      description: 'Earnings are now available for withdrawal',
      date: creditDate,
      completed: now >= creditDate,
      current: false,
      icon: 'check-circle'
    }
  ];
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date with time for display
 */
export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get relative time string (e.g., "in 3 days", "2 days ago")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
};

/**
 * Get earnings credit status message
 */
export const getEarningsCreditStatus = (isPremium: boolean, earningDate: Date): string => {
  const timeline = getEarningsCreditTimeline(isPremium, earningDate);
  
  if (timeline.isCreditable) {
    return 'Available for withdrawal';
  } else if (timeline.businessDaysRemaining === 0) {
    return 'Processing (available soon)';
  } else {
    return `Processing (${timeline.businessDaysRemaining} business days remaining)`;
  }
};
