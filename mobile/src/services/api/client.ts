import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './endpoints';
import { storageHelpers } from '../storage/mmkv';

// API error types
export interface IApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
  isNetworkError: boolean;
  isServerError: boolean;
  isAuthError: boolean;

  constructor(error: IApiError) {
    super(error.message);
    this.name = 'ApiError';
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.errors = error.errors;
    this.isNetworkError = !error.statusCode;
    this.isServerError = error.statusCode ? error.statusCode >= 500 : false;
    this.isAuthError = error.statusCode === 401 || error.statusCode === 403;
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['get', 'head', 'options', 'put', 'delete'],
};

// Auth state tracking - used to coordinate token refresh across concurrent requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeToTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Create axios instance with enhanced configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip auth header for refresh requests
    if (!(config as any)._isRefreshRequest) {
      // Get auth token from storage
      const authData = storageHelpers.getObject<{ token: string }>('auth');
      const token = authData?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log requests in development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Calculate exponential backoff delay
const getRetryDelay = (retryCount: number): number => {
  const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
};

// Check if request should be retried
const shouldRetry = (error: AxiosError, retryCount: number): boolean => {
  if (retryCount >= RETRY_CONFIG.maxRetries) return false;

  const method = error.config?.method?.toLowerCase();
  if (!method || !RETRY_CONFIG.retryableMethods.includes(method)) return false;

  // Retry on network errors
  if (!error.response) return true;

  // Retry on specific status codes
  return RETRY_CONFIG.retryableStatuses.includes(error.response.status);
};

// Response interceptor - Handle errors, token refresh, and retry logic
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }
    return response;
  },
  async (error: AxiosError<IApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
      _isRefreshRequest?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Log errors in development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        retryCount: originalRequest._retryCount || 0,
      });
    }

    // Initialize retry count
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // Handle 401 Unauthorized - Try to refresh token
    // Skip refresh logic for refresh requests to prevent infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest._isRefreshRequest
    ) {
      originalRequest._retry = true;

      // If already refreshing, wait for the new token
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeToTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const authData = storageHelpers.getObject<{
          token: string;
          refreshToken: string;
        }>('auth');
        const refreshToken = authData?.refreshToken;

        if (refreshToken) {
          // Attempt to refresh the token using a special flag
          const refreshConfig = {
            method: 'POST',
            url: '/auth/refresh',
            data: { refreshToken },
            headers: { 'Content-Type': 'application/json' },
            _isRefreshRequest: true,
          };

          const response = await apiClient(refreshConfig);

          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          // Update stored tokens
          if (authData) {
            storageHelpers.setObject('auth', {
              ...authData,
              token: newToken,
              refreshToken: newRefreshToken,
            });
          }

          isRefreshing = false;
          onTokenRefreshed(newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Refresh failed - clear auth and redirect to login
        storageHelpers.delete('auth');
        storageHelpers.delete('userProfile');

        // Emit auth failure event for the app to handle navigation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('auth:logout', { detail: { reason: 'token_expired' } })
          );
        }

        return Promise.reject(refreshError);
      }
    }

    // Implement retry logic for transient failures
    if (shouldRetry(error, originalRequest._retryCount)) {
      originalRequest._retryCount += 1;
      const delay = getRetryDelay(originalRequest._retryCount);

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(
          `[API Retry] Attempt ${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries} after ${delay}ms`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // Transform error to ApiError
    const apiError: IApiError = {
      message: getErrorMessage(error),
      code: error.response?.data?.code || error.code,
      statusCode: error.response?.status,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(new ApiError(apiError));
  }
);

// Get user-friendly error message
const getErrorMessage = (error: AxiosError<IApiError>): string => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (error.response.data?.message) {
    return error.response.data.message;
  }

  switch (error.response.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to check if error is a network error
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.isNetworkError;
  }
  return false;
};

// Helper function to check if error is an auth error
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.isAuthError;
  }
  return false;
};

// Helper to set auth token manually (useful for initial login)
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Helper to clear auth state
export const clearAuthState = () => {
  setAuthToken(null);
  storageHelpers.delete('auth');
  storageHelpers.delete('userProfile');
};

export default apiClient;
