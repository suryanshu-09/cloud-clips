import { authService as firebaseAuthService } from '@/services/firebase/auth';
import apiClient from '@/services/api/client';
import { mockAuthService } from './mockAuthService';
import type { ILoginCredentials, IRegisterData, IAuthResponse, IAuthUser } from '../types';

// Check if running in dev mode
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

console.log(`[AUTH] Running in ${DEV_MODE ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

if (DEV_MODE) {
  console.log('[AUTH] Using mock authentication service');
  console.log('[AUTH] Available test accounts:');
  console.log('  Clients: client1@test.com, client2@test.com');
  console.log('  Barbers: barber1@test.com, barber2@test.com');
  console.log('  Password: password123');
}

/**
 * Auth service that integrates Firebase Auth with backend API
 * In dev mode, uses mock data to bypass Firebase
 */
export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: ILoginCredentials): Promise<IAuthResponse> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.login(credentials);
    }

    try {
      // Sign in with Firebase
      const userCredential = await firebaseAuthService.signIn(
        credentials.email,
        credentials.password
      );

      // Get Firebase ID token
      const token = await userCredential.user.getIdToken();

      // Authenticate with backend API
      const response = await apiClient.post<IAuthResponse>('/auth/login', {
        firebaseToken: token,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Register a new user
   */
  register: async (data: IRegisterData): Promise<IAuthResponse> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.register(data);
    }

    try {
      // Create Firebase user
      const userCredential = await firebaseAuthService.signUp(data.email, data.password, data.name);

      // Get Firebase ID token
      const token = await userCredential.user.getIdToken();

      // Register with backend API
      const response = await apiClient.post<IAuthResponse>('/auth/register', {
        firebaseToken: token,
        name: data.name,
        phone: data.phone,
        role: data.role,
        email: data.email,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.logout();
    }

    try {
      // Sign out from Firebase
      await firebaseAuthService.signOut();

      // Optionally notify backend
      await apiClient.post('/auth/logout').catch(() => {
        // Ignore backend errors on logout
      });
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.sendPasswordResetEmail(email);
    }

    try {
      await firebaseAuthService.sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  /**
   * Get current user profile from backend
   */
  getCurrentUser: async (): Promise<IAuthUser> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.getCurrentUser();
    }

    try {
      const response = await apiClient.get<IAuthUser>('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile');
    }
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<string> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.refreshToken();
    }

    try {
      const token = await firebaseAuthService.getIdToken(true);
      if (!token) {
        throw new Error('No token available');
      }
      return token;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to refresh token');
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: Partial<IAuthUser>): Promise<IAuthUser> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.updateProfile(updates);
    }

    try {
      const response = await apiClient.patch<IAuthUser>('/auth/profile', updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Delete user account
   */
  deleteAccount: async (): Promise<void> => {
    // Use mock service in dev mode
    if (DEV_MODE) {
      return mockAuthService.deleteAccount();
    }

    try {
      // Delete from backend
      await apiClient.delete('/auth/account');

      // Delete from Firebase
      await firebaseAuthService.deleteAccount();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete account');
    }
  },
};

export default authService;
