/**
 * Google Maps API Configuration
 * 
 * This file contains configuration for Google Maps services including
 * Places API for location autocomplete functionality.
 */

// Google Maps API Key - In production, this should be loaded from environment variables
// For React Native, you can use react-native-config or similar library
// The key below is from the Android google-services.json configuration
export const GOOGLE_MAPS_CONFIG = {
  // API Key for Google Places API
  API_KEY: 'AIzaSyBamdG5TwWa4VjiVHo1rk4zgyMWHE4JQJc',
  
  // Base URLs for different Google Maps services
  PLACES_API_BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  GEOCODING_API_BASE_URL: 'https://maps.googleapis.com/maps/api/geocode',
  
  // Default configuration for Places Autocomplete
  PLACES_AUTOCOMPLETE_CONFIG: {
    types: '(cities)', // Restrict to cities only
    language: 'en', // Default language
    components: '', // Can be used to restrict to specific countries
  },
  
  // Request timeout in milliseconds
  REQUEST_TIMEOUT: 10000,
  
  // Rate limiting configuration
  RATE_LIMIT: {
    maxRequestsPerMinute: 60,
    debounceDelay: 300, // milliseconds
  },
};

// Type definitions for Google Places API responses
export interface GooglePlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

export interface GooglePlacesResponse {
  predictions: GooglePlacesPrediction[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string;
}

// Helper function to build Places Autocomplete URL
export const buildPlacesAutocompleteUrl = (
  query: string,
  options: Partial<typeof GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_CONFIG> = {}
): string => {
  const config = { ...GOOGLE_MAPS_CONFIG.PLACES_AUTOCOMPLETE_CONFIG, ...options };
  const params = new URLSearchParams({
    input: query,
    key: GOOGLE_MAPS_CONFIG.API_KEY,
    types: config.types,
    language: config.language,
  });

  if (config.components) {
    params.append('components', config.components);
  }

  return `${GOOGLE_MAPS_CONFIG.PLACES_API_BASE_URL}/autocomplete/json?${params.toString()}`;
};

// Helper function to validate API response
export const validatePlacesResponse = (response: any): GooglePlacesResponse => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format');
  }

  if (!response.status) {
    throw new Error('Missing status in API response');
  }

  if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
    throw new Error(response.error_message || `API error: ${response.status}`);
  }

  return response as GooglePlacesResponse;
};
