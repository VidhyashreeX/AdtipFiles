// Enhanced Currency Utilities
// Proper currency conversion and formatting system

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: number;
}

export interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
  decimals: number;
  locale: string;
}

// Currency configurations
export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  INR: {
    symbol: '₹',
    code: 'INR',
    name: 'Indian Rupee',
    decimals: 2,
    locale: 'en-IN',
  },
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    decimals: 2,
    locale: 'en-US',
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'Euro',
    decimals: 2,
    locale: 'en-EU',
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    name: 'British Pound',
    decimals: 2,
    locale: 'en-GB',
  },
};

// Current exchange rates (in production, fetch from API)
export const EXCHANGE_RATES: Record<string, number> = {
  // Base: 1 USD
  'USD_TO_INR': 83.25,
  'USD_TO_EUR': 0.92,
  'USD_TO_GBP': 0.79,
  
  // Base: 1 INR
  'INR_TO_USD': 0.012,
  'INR_TO_EUR': 0.011,
  'INR_TO_GBP': 0.0095,
  
  // Base: 1 EUR
  'EUR_TO_USD': 1.09,
  'EUR_TO_INR': 90.54,
  'EUR_TO_GBP': 0.86,
  
  // Base: 1 GBP
  'GBP_TO_USD': 1.27,
  'GBP_TO_INR': 105.38,
  'GBP_TO_EUR': 1.16,
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rateKey = `${fromCurrency}_TO_${toCurrency}`;
  const rate = EXCHANGE_RATES[rateKey];

  if (!rate) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    return amount; // Return original amount if rate not found
  }

  return amount * rate;
}

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'INR',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits,
    maximumFractionDigits,
    compact = false,
  } = options;

  const config = CURRENCY_CONFIGS[currency];
  
  if (!config) {
    console.warn(`Currency config not found for ${currency}`);
    return amount.toString();
  }

  // Handle compact formatting for large numbers
  if (compact && amount >= 1000) {
    return formatCompactCurrency(amount, currency, showSymbol);
  }

  // Format the number
  const formattedNumber = amount.toLocaleString(config.locale, {
    minimumFractionDigits: minimumFractionDigits ?? config.decimals,
    maximumFractionDigits: maximumFractionDigits ?? config.decimals,
  });

  // Build the formatted string
  let result = '';
  
  if (showSymbol) {
    result += config.symbol;
  }
  
  result += formattedNumber;
  
  if (showCode) {
    result += ` ${config.code}`;
  }

  return result;
}

/**
 * Format currency in compact form (1K, 1M, etc.)
 */
export function formatCompactCurrency(
  amount: number,
  currency: Currency = 'INR',
  showSymbol: boolean = true
): string {
  const config = CURRENCY_CONFIGS[currency];
  const symbol = showSymbol ? config.symbol : '';

  if (amount >= 1e9) {
    return `${symbol}${(amount / 1e9).toFixed(1)}B`;
  } else if (amount >= 1e6) {
    return `${symbol}${(amount / 1e6).toFixed(1)}M`;
  } else if (amount >= 1e3) {
    return `${symbol}${(amount / 1e3).toFixed(1)}K`;
  } else {
    return `${symbol}${amount.toFixed(0)}`;
  }
}

/**
 * Convert and format currency in one step
 */
export function convertAndFormatCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  options?: Parameters<typeof formatCurrency>[2]
): string {
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(convertedAmount, toCurrency, options);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string, currency: Currency = 'INR'): number {
  const config = CURRENCY_CONFIGS[currency];
  
  // Remove currency symbol and code
  let cleanString = currencyString
    .replace(config.symbol, '')
    .replace(config.code, '')
    .trim();

  // Handle compact notation
  if (cleanString.includes('K')) {
    return parseFloat(cleanString.replace('K', '')) * 1000;
  } else if (cleanString.includes('M')) {
    return parseFloat(cleanString.replace('M', '')) * 1000000;
  } else if (cleanString.includes('B')) {
    return parseFloat(cleanString.replace('B', '')) * 1000000000;
  }

  // Remove commas and parse
  return parseFloat(cleanString.replace(/,/g, '')) || 0;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_CONFIGS[currency]?.symbol || '';
}

/**
 * Get currency code
 */
export function getCurrencyCode(currency: Currency): string {
  return CURRENCY_CONFIGS[currency]?.code || '';
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency): string {
  return CURRENCY_CONFIGS[currency]?.name || '';
}

/**
 * Validate currency amount
 */
export function validateCurrencyAmount(
  amount: number,
  currency: Currency,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): { isValid: boolean; error?: string } {
  const { min = 0, max = Infinity, allowZero = true } = options;

  if (isNaN(amount) || !isFinite(amount)) {
    return { isValid: false, error: 'Invalid amount' };
  }

  if (!allowZero && amount === 0) {
    return { isValid: false, error: 'Amount cannot be zero' };
  }

  if (amount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (amount < min) {
    return { 
      isValid: false, 
      error: `Amount must be at least ${formatCurrency(min, currency)}` 
    };
  }

  if (amount > max) {
    return { 
      isValid: false, 
      error: `Amount cannot exceed ${formatCurrency(max, currency)}` 
    };
  }

  return { isValid: true };
}

/**
 * Get user's preferred currency (from localStorage or default)
 */
export function getUserCurrency(): Currency {
  try {
    const stored = localStorage.getItem('userCurrency');
    if (stored && Object.keys(CURRENCY_CONFIGS).includes(stored)) {
      return stored as Currency;
    }
  } catch (error) {
    console.warn('Failed to get user currency from localStorage:', error);
  }
  
  // Default to INR for Indian users, USD for others
  const userLocale = navigator.language || 'en-IN';
  return userLocale.includes('IN') ? 'INR' : 'USD';
}

/**
 * Set user's preferred currency
 */
export function setUserCurrency(currency: Currency): void {
  try {
    localStorage.setItem('userCurrency', currency);
  } catch (error) {
    console.warn('Failed to save user currency to localStorage:', error);
  }
}

/**
 * Format price range
 */
export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  currency: Currency = 'INR'
): string {
  if (minAmount === maxAmount) {
    return formatCurrency(minAmount, currency);
  }
  
  return `${formatCurrency(minAmount, currency)} - ${formatCurrency(maxAmount, currency)}`;
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(
  amount: number,
  percentage: number,
  currency: Currency = 'INR'
): { amount: number; formatted: string } {
  const calculatedAmount = (amount * percentage) / 100;
  return {
    amount: calculatedAmount,
    formatted: formatCurrency(calculatedAmount, currency),
  };
}

/**
 * Format currency for input fields (no symbol, proper decimals)
 */
export function formatCurrencyForInput(
  amount: number,
  currency: Currency = 'INR'
): string {
  const config = CURRENCY_CONFIGS[currency];
  return amount.toFixed(config.decimals);
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) return 1;
  
  const rateKey = `${from}_TO_${to}`;
  return EXCHANGE_RATES[rateKey] || 1;
}

/**
 * Update exchange rates (for API integration)
 */
export function updateExchangeRates(rates: Record<string, number>): void {
  Object.assign(EXCHANGE_RATES, rates);
}

// Export commonly used functions
export {
  convertCurrency as convert,
  formatCurrency as format,
  convertAndFormatCurrency as convertAndFormat,
  formatCompactCurrency as formatCompact,
};