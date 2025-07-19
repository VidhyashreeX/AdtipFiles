// src/utils/withdrawalMessaging.ts
// Utility functions for withdrawal messaging based on user type

export interface WithdrawalLimits {
  minimumAmount: number;
  maximumAmount: number;
  processingDays: number;
  chargesPercent: number;
}

export interface WithdrawalMessaging {
  title: string;
  subtitle: string;
  processingMessage: string;
  requirementsMessage: string;
  benefitsMessage?: string;
  warningMessage?: string;
  successMessage: string;
  limits: WithdrawalLimits;
}

/**
 * Get withdrawal messaging based on user premium status
 */
export const getWithdrawalMessaging = (isPremium: boolean): WithdrawalMessaging => {
  if (isPremium) {
    return {
      title: "Premium Withdrawal",
      subtitle: "Enjoy faster processing and lower minimums",
      processingMessage: "Your withdrawal will be processed within 5 business days. As a premium user, you get priority processing.",
      requirementsMessage: "Premium users enjoy reduced minimum withdrawal amounts and faster processing times.",
      benefitsMessage: "✓ 5 business days processing\n✓ ₹1,000 minimum withdrawal\n✓ Priority support\n✓ Lower platform commission (30%)",
      successMessage: "Your premium withdrawal request has been submitted! You'll receive your money within 5 business days.",
      limits: {
        minimumAmount: 1000,
        maximumAmount: 50000,
        processingDays: 5,
        chargesPercent: 5
      }
    };
  } else {
    return {
      title: "Standard Withdrawal",
      subtitle: "Upgrade to premium for faster processing",
      processingMessage: "Your withdrawal will be processed within 21 business days. Upgrade to premium for faster processing (5 days).",
      requirementsMessage: "Standard users have higher minimum withdrawal amounts and longer processing times.",
      warningMessage: "⚠️ Consider upgrading to premium for:\n• Faster processing (5 vs 21 days)\n• Lower minimum (₹1,000 vs ₹5,000)\n• Reduced platform commission (30% vs 60%)",
      successMessage: "Your withdrawal request has been submitted! You'll receive your money within 21 business days. Upgrade to premium for faster processing.",
      limits: {
        minimumAmount: 5000,
        maximumAmount: 50000,
        processingDays: 21,
        chargesPercent: 5
      }
    };
  }
};

/**
 * Get withdrawal confirmation message
 */
export const getWithdrawalConfirmationMessage = (
  isPremium: boolean, 
  amount: number, 
  charges: number, 
  netAmount: number
): string => {
  const messaging = getWithdrawalMessaging(isPremium);
  
  return `${messaging.successMessage}\n\nDetails:\nAmount: ₹${amount}\nCharges: ₹${charges.toFixed(2)}\nNet Amount: ₹${netAmount.toFixed(2)}\nProcessing Time: ${messaging.limits.processingDays} business days`;
};

/**
 * Get withdrawal eligibility message
 */
export const getWithdrawalEligibilityMessage = (
  isPremium: boolean,
  currentBalance: number,
  requestedAmount: number
): { eligible: boolean; message: string } => {
  const messaging = getWithdrawalMessaging(isPremium);
  
  if (requestedAmount < messaging.limits.minimumAmount) {
    return {
      eligible: false,
      message: `Minimum withdrawal amount is ₹${messaging.limits.minimumAmount} for ${isPremium ? 'premium' : 'standard'} users.`
    };
  }
  
  if (requestedAmount > messaging.limits.maximumAmount) {
    return {
      eligible: false,
      message: `Maximum withdrawal amount is ₹${messaging.limits.maximumAmount} per transaction.`
    };
  }
  
  if (requestedAmount > currentBalance) {
    return {
      eligible: false,
      message: `Insufficient balance. You have ₹${currentBalance.toFixed(2)} available.`
    };
  }
  
  return {
    eligible: true,
    message: `You can withdraw ₹${requestedAmount}. Processing time: ${messaging.limits.processingDays} business days.`
  };
};

/**
 * Get processing timeline message
 */
export const getProcessingTimelineMessage = (isPremium: boolean): string => {
  const messaging = getWithdrawalMessaging(isPremium);
  
  if (isPremium) {
    return `As a premium user, your withdrawal will be processed within ${messaging.limits.processingDays} business days with priority support.`;
  } else {
    return `Standard processing takes ${messaging.limits.processingDays} business days. Upgrade to premium for 5-day processing.`;
  }
};

/**
 * Get upgrade suggestion message for non-premium users
 */
export const getUpgradeSuggestionMessage = (): string => {
  return "Upgrade to Premium for:\n• 5-day processing (vs 21 days)\n• ₹1,000 minimum (vs ₹5,000)\n• 30% platform commission (vs 60%)\n• Priority customer support";
};

/**
 * Get withdrawal method recommendations
 */
export const getWithdrawalMethodRecommendations = (isPremium: boolean): string[] => {
  const baseRecommendations = [
    "Ensure your bank account details are correct",
    "Double-check your UPI ID format (e.g., name@paytm)",
    "Keep your registered mobile number active"
  ];
  
  if (isPremium) {
    return [
      ...baseRecommendations,
      "Premium users get priority processing",
      "Contact premium support for any issues"
    ];
  } else {
    return [
      ...baseRecommendations,
      "Consider upgrading to premium for faster processing",
      "Standard processing may take up to 21 business days"
    ];
  }
};

/**
 * Get withdrawal status messages
 */
export const getWithdrawalStatusMessage = (
  status: 'pending' | 'approved' | 'rejected' | 'completed',
  isPremium: boolean
): string => {
  const userType = isPremium ? 'premium' : 'standard';
  const processingDays = isPremium ? 5 : 21;
  
  switch (status) {
    case 'pending':
      return `Your withdrawal request is being reviewed. ${userType} users typically get processed within ${processingDays} business days.`;
    case 'approved':
      return `Your withdrawal has been approved and is being processed. You should receive the money within ${processingDays} business days.`;
    case 'rejected':
      return `Your withdrawal request was rejected. Please check your details and try again, or contact support for assistance.`;
    case 'completed':
      return `Your withdrawal has been completed successfully! The money should be in your account.`;
    default:
      return `Withdrawal status: ${status}`;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
