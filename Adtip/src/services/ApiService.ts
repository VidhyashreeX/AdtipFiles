// src/services/ApiService.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to add auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response) {
      // Server responded with an error
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        // Could handle logout or token refresh here
      }
      
      if (error.response.status === 429) {
        // Rate limited
        console.warn('API rate limit exceeded. Please try again later.');
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Service for handling network requests
 */
export default class ApiService {
  /**
   * Make a GET request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param params - Query parameters
   * @param config - Additional axios config
   */
  static async get<T = any>(
    url: string, 
    params?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.get(url, { 
        params, 
        ...config 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param data - Request body data
   * @param config - Additional axios config
   */
  static async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a PUT request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param data - Request body data
   * @param config - Additional axios config
   */
  static async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a PATCH request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param data - Request body data
   * @param config - Additional axios config
   */
  static async patch<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param config - Additional axios config
   */
  static async delete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload a file
   * @param url - Endpoint URL (will be appended to base URL)
   * @param formData - FormData containing file and additional data
   * @param onProgress - Progress callback (percentage)
   * @param config - Additional axios config
   */
  static async uploadFile<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (percentage: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentage);
          }
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Standard error handler
   * @param error - Error object
   */
  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const serverError = error.response?.data?.message || error.message;
      return new Error(serverError);
    }
    return error;
  }
}
