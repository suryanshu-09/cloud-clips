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

  constructor(error: IApiError) {
    super(error.message);
    this.name = 'ApiError';
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.errors = error.errors;
  }
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get auth token from storage
    const authData = storageHelpers.getObject<{ token: string }>('auth');
    const token = authData?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (__DEV__) {
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

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (__DEV__) {
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
    };

    // Log errors in development
    if (__DEV__) {
      console.error('[API Response Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authData = storageHelpers.getObject<{
          token: string;
          refreshToken: string;
        }>('auth');
        const refreshToken = authData?.refreshToken;

        if (refreshToken) {
          // Attempt to refresh the token
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );

          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          // Update stored tokens
          if (authData) {
            storageHelpers.setObject('auth', {
              ...authData,
              token: newToken,
              refreshToken: newRefreshToken,
            });
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        storageHelpers.delete('auth');
        storageHelpers.delete('userProfile');
        // Note: Navigation to login should be handled by the app's auth context
        console.error('[Token Refresh Failed]', refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Transform error to ApiError
    const apiError: IApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || error.code,
      statusCode: error.response?.status,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(new ApiError(apiError));
  }
);

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

export default apiClient;
