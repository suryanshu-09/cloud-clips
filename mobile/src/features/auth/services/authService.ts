import { authService as firebaseAuthService } from '@/services/firebase/auth';
import apiClient, { setAuthToken, clearAuthState } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { storageHelpers } from '@/services/storage/mmkv';
import type {
  ILoginCredentials,
  IRegisterData,
  IAuthResponse,
  IAuthUser,
  IOAuthResponse,
  IGoogleAuthData,
  IAppleAuthData,
  IResetPasswordData,
} from '../types';

// Storage keys
const AUTH_STORAGE_KEY = 'auth';
const USER_PROFILE_KEY = 'userProfile';
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';

// Check if running in dev mode
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Only import mock service if needed (tree-shaking optimization)
let mockAuthService: typeof import('./mockAuthService').mockAuthService | null = null;
if (DEV_MODE) {
  import('./mockAuthService').then((module) => {
    mockAuthService = module.mockAuthService;
  });
  console.log('[AUTH] Running in DEVELOPMENT mode with mock fallback');
  console.log('[AUTH] Available test accounts:');
  console.log('  Clients: client1@test.com, client2@test.com');
  console.log('  Barbers: barber1@test.com, barber2@test.com');
  console.log('  Password: password123');
}

/**
 * Helper to store auth data securely
 */
const storeAuthData = (response: IAuthResponse | IOAuthResponse): void => {
  const token = 'accessToken' in response ? response.accessToken : response.token;
  // Store tokens
  storageHelpers.setObject(AUTH_STORAGE_KEY, {
    token,
    refreshToken: response.refreshToken,
    userId: response.user.id,
  });

  // Store user profile
  storageHelpers.setObject(USER_PROFILE_KEY, response.user);

  // Set token in API client
  setAuthToken(token);
};

/**
 * Helper to get stored user profile
 */
const getStoredUser = (): IAuthUser | null => {
  return storageHelpers.getObject<IAuthUser>(USER_PROFILE_KEY);
};

/**
 * Auth service that integrates Firebase Auth with backend API
 * Falls back to mock service in dev mode when Firebase is unavailable
 */
export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: ILoginCredentials): Promise<IAuthResponse> => {
    try {
      // First try backend-direct auth (for when Firebase isn't configured)
      const response = await apiClient.post<IAuthResponse>(endpoints.auth.login, {
        email: credentials.email,
        password: credentials.password,
      });

      storeAuthData(response.data);
      return response.data;
    } catch (backendError: any) {
      // If backend auth fails and we have Firebase configured, try Firebase
      try {
        const userCredential = await firebaseAuthService.signIn(
          credentials.email,
          credentials.password
        );

        // Get Firebase ID token
        const firebaseToken = await userCredential.user.getIdToken();

        // Authenticate with backend using Firebase token
        const response = await apiClient.post<IAuthResponse>(endpoints.auth.firebaseSync, {
          firebaseToken,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
        });

        storeAuthData(response.data);
        return response.data;
      } catch (firebaseError: any) {
        // In dev mode, fall back to mock service
        if (DEV_MODE && mockAuthService) {
          console.log('[AUTH] Using mock authentication fallback');
          const mockResponse = await mockAuthService.login(credentials);
          storeAuthData(mockResponse);
          return mockResponse;
        }

        // Re-throw the original backend error for better error messages
        throw new Error(backendError.message || firebaseError.message || 'Login failed');
      }
    }
  },

  /**
   * Register a new user
   */
  register: async (data: IRegisterData): Promise<IAuthResponse> => {
    try {
      // Try backend-direct registration
      const response = await apiClient.post<IAuthResponse>(endpoints.auth.register, {
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        role: data.role,
      });

      storeAuthData(response.data);
      return response.data;
    } catch (backendError: any) {
      // Try Firebase registration if backend fails
      try {
        const userCredential = await firebaseAuthService.signUp(
          data.email,
          data.password,
          data.name
        );

        // Get Firebase ID token
        const firebaseToken = await userCredential.user.getIdToken();

        // Register with backend using Firebase token
        const response = await apiClient.post<IAuthResponse>(endpoints.auth.register, {
          firebaseToken,
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role,
        });

        storeAuthData(response.data);
        return response.data;
      } catch (firebaseError: any) {
        // In dev mode, fall back to mock service
        if (DEV_MODE && mockAuthService) {
          console.log('[AUTH] Using mock registration fallback');
          const mockResponse = await mockAuthService.register(data);
          storeAuthData(mockResponse);
          return mockResponse;
        }

        throw new Error(backendError.message || firebaseError.message || 'Registration failed');
      }
    }
  },

  /**
   * Sign in with Google OAuth
   */
  loginWithGoogle: async (googleData: IGoogleAuthData): Promise<IOAuthResponse> => {
    try {
      const response = await apiClient.post<IOAuthResponse>(endpoints.auth.googleAuth, {
        idToken: googleData.idToken,
      });

      storeAuthData(response.data);
      return response.data;
    } catch (error: any) {
      // In dev mode, simulate success
      if (DEV_MODE) {
        console.log('[AUTH] Google OAuth not configured - dev mode simulation');
        throw new Error('Google Sign-In is not configured. Please set up Google OAuth.');
      }
      throw new Error(error.response?.data?.message || error.message || 'Google sign-in failed');
    }
  },

  /**
   * Sign in with Apple OAuth
   */
  loginWithApple: async (appleData: IAppleAuthData): Promise<IOAuthResponse> => {
    try {
      const response = await apiClient.post<IOAuthResponse>(endpoints.auth.appleAuth, {
        identityToken: appleData.identityToken,
        fullName: appleData.fullName,
        email: appleData.email,
      });

      storeAuthData(response.data);
      return response.data;
    } catch (error: any) {
      // In dev mode, simulate success
      if (DEV_MODE) {
        console.log('[AUTH] Apple OAuth not configured - dev mode simulation');
        throw new Error('Apple Sign-In is not configured. Please set up Apple OAuth.');
      }
      throw new Error(error.response?.data?.message || error.message || 'Apple sign-in failed');
    }
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      // Notify backend of logout (ignore errors)
      await apiClient.post(endpoints.auth.logout).catch(() => {});

      // Sign out from Firebase if available
      await firebaseAuthService.signOut().catch(() => {});
    } finally {
      // Always clear local auth state
      clearAuthState();
    }
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    try {
      // Try backend password reset
      await apiClient.post(endpoints.auth.forgotPassword, { email });
    } catch (backendError: any) {
      // Try Firebase password reset
      try {
        await firebaseAuthService.sendPasswordResetEmail(email);
      } catch (firebaseError: any) {
        // In dev mode, simulate success
        if (DEV_MODE) {
          console.log('[AUTH] Mock password reset email sent to:', email);
          return;
        }
        throw new Error(
          backendError.message || firebaseError.message || 'Failed to send password reset email'
        );
      }
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: IResetPasswordData): Promise<void> => {
    try {
      await apiClient.post(endpoints.auth.resetPassword, {
        token: data.token,
        newPassword: data.newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to reset password');
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<void> => {
    try {
      await apiClient.post(endpoints.auth.verifyEmail, { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to verify email');
    }
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    try {
      await apiClient.post(endpoints.auth.resendVerification, { email });
    } catch (error: any) {
      // Always show success to prevent email enumeration
      console.log('[AUTH] Resend verification requested for:', email);
    }
  },

  /**
   * Get current user profile from backend
   */
  getCurrentUser: async (): Promise<IAuthUser> => {
    try {
      const response = await apiClient.get<IAuthUser>(endpoints.auth.me);
      // Update stored profile
      storageHelpers.setObject(USER_PROFILE_KEY, response.data);
      return response.data;
    } catch (error: any) {
      // Return stored user if available
      const storedUser = getStoredUser();
      if (storedUser) {
        return storedUser;
      }

      // In dev mode, return mock user
      if (DEV_MODE && mockAuthService) {
        return mockAuthService.getCurrentUser();
      }

      throw new Error(error.message || 'Failed to get user profile');
    }
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<string> => {
    // First try Firebase token refresh
    try {
      const firebaseToken = await firebaseAuthService.getIdToken(true);
      if (firebaseToken) {
        // Sync with backend
        const response = await apiClient.post<{ token: string; refreshToken: string }>(
          endpoints.auth.refresh,
          { firebaseToken }
        );

        setAuthToken(response.data.token);
        const authData = storageHelpers.getObject<any>(AUTH_STORAGE_KEY);
        if (authData) {
          storageHelpers.setObject(AUTH_STORAGE_KEY, {
            ...authData,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          });
        }
        return response.data.token;
      }
    } catch {
      // Continue to backend refresh
    }

    // Try backend token refresh
    const authData = storageHelpers.getObject<{ refreshToken: string }>(AUTH_STORAGE_KEY);
    if (authData?.refreshToken) {
      const response = await apiClient.post<{ token: string; refreshToken: string }>(
        endpoints.auth.refresh,
        { refreshToken: authData.refreshToken }
      );

      setAuthToken(response.data.token);
      storageHelpers.setObject(AUTH_STORAGE_KEY, {
        ...authData,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      });
      return response.data.token;
    }

    throw new Error('No refresh token available');
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<IAuthUser>): Promise<IAuthUser> => {
    try {
      const response = await apiClient.put<IAuthUser>(endpoints.users.updateProfile, updates);
      storageHelpers.setObject(USER_PROFILE_KEY, response.data);
      return response.data;
    } catch (error: any) {
      // In dev mode, return mock update
      if (DEV_MODE && mockAuthService) {
        return mockAuthService.updateProfile(updates);
      }
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Delete user account
   */
  deleteAccount: async (): Promise<void> => {
    try {
      // Delete from backend
      const storedUser = getStoredUser();
      if (storedUser) {
        await apiClient.delete(endpoints.users.delete(storedUser.id));
      }

      // Delete from Firebase
      await firebaseAuthService.deleteAccount().catch(() => {});
    } finally {
      // Always clear local state
      clearAuthState();
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const authData = storageHelpers.getObject<{ token: string }>(AUTH_STORAGE_KEY);
    return !!authData?.token;
  },

  /**
   * Get stored auth token
   */
  getStoredToken: (): string | null => {
    const authData = storageHelpers.getObject<{ token: string }>(AUTH_STORAGE_KEY);
    return authData?.token || null;
  },

  /**
   * Initialize auth state from storage
   * Call this on app startup
   */
  initializeAuth: (): IAuthUser | null => {
    const authData = storageHelpers.getObject<{ token: string }>(AUTH_STORAGE_KEY);
    if (authData?.token) {
      setAuthToken(authData.token);
      return getStoredUser();
    }
    return null;
  },

  /**
   * Check if biometric login is enabled
   */
  isBiometricEnabled: (): boolean => {
    return storageHelpers.getBoolean(BIOMETRIC_ENABLED_KEY) || false;
  },

  /**
   * Enable or disable biometric login
   */
  setBiometricEnabled: (enabled: boolean): void => {
    storageHelpers.setBoolean(BIOMETRIC_ENABLED_KEY, enabled);
  },
};

export default authService;
