import { useEffect, useCallback, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  authAtom,
  loginAtom,
  logoutAtom,
  isAuthenticatedAtom,
  currentUserAtom,
  userRoleAtom,
} from '@/store/atoms/authAtom';
import { authService } from '../services/authService';
import {
  authService as firebaseAuthService,
  IGoogleSignInResult,
  IAppleSignInResult,
  IPhoneSignInResult,
} from '@/services/firebase/auth';
import { cleanupNotifications } from '@/services/notifications';
import type { ILoginCredentials, IAuthResponse, IAuthUser } from '../types';

/**
 * Main authentication hook
 * Provides auth state and methods with Firebase integration
 */
export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isInitializing = useRef(true);

  // Atoms
  const [_auth, setAuth] = useAtom(authAtom);
  const setLogin = useSetAtom(loginAtom);
  const setLogout = useSetAtom(logoutAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const userRole = useAtomValue(userRoleAtom);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    if (!firebaseAuthService.isInitialized()) {
      isInitializing.current = false;
      return;
    }

    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      if (isInitializing.current) {
        // Skip first callback during initialization to avoid duplicate login
        isInitializing.current = false;
        return;
      }

      if (firebaseUser && !isAuthenticated) {
        // Firebase user exists but app state shows logged out
        // This can happen after app restart - try to sync
        try {
          const _token = await firebaseUser.getIdToken();
          // The existing stored auth should handle this case
          console.log('[useAuth] Firebase user detected, syncing state');
        } catch (error) {
          console.error('[useAuth] Error syncing Firebase state:', error);
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated]);

  // Notifications are now initialized globally via useNotificationSetup in _layout.tsx
  // Token registration is handled automatically when auth state changes

  // Handle successful login
  const handleLoginSuccess = useCallback(
    async (data: IAuthResponse) => {
      setLogin({
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      });

      // Push token registration is handled automatically by useNotificationSetup
      // when auth state changes to authenticated

      // Navigate based on user role
      if (data.user.role === 'barber') {
        router.replace('/(barber)');
      } else {
        router.replace('/(client)');
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    [setLogin, router, queryClient]
  );

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: ILoginCredentials) => authService.login(credentials),
    onSuccess: handleLoginSuccess,
    onError: (error: Error) => {
      console.error('Login error:', error.message);
    },
  });

  // Google Sign-In mutation
  const googleSignInMutation = useMutation({
    mutationFn: async (googleResult: IGoogleSignInResult) => {
      // First sign in with Firebase
      const userCredential = await firebaseAuthService.signInWithGoogle(googleResult);

      // Get Firebase token
      const firebaseToken = await userCredential.user.getIdToken();

      // Sync with backend
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/firebase-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${firebaseToken}`,
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName,
            avatar: userCredential.user.photoURL,
            provider: 'google',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      return response.json() as Promise<IAuthResponse>;
    },
    onSuccess: handleLoginSuccess,
    onError: (error: Error) => {
      console.error('Google Sign-In error:', error.message);
    },
  });

  // Apple Sign-In mutation
  const appleSignInMutation = useMutation({
    mutationFn: async (appleResult: IAppleSignInResult) => {
      // First sign in with Firebase
      const userCredential = await firebaseAuthService.signInWithApple(appleResult);

      // Get Firebase token
      const firebaseToken = await userCredential.user.getIdToken();

      // Sync with backend
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/firebase-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${firebaseToken}`,
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user.uid,
            email: userCredential.user.email || appleResult.email,
            name:
              userCredential.user.displayName ||
              [appleResult.fullName?.givenName, appleResult.fullName?.familyName]
                .filter(Boolean)
                .join(' '),
            provider: 'apple',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      return response.json() as Promise<IAuthResponse>;
    },
    onSuccess: handleLoginSuccess,
    onError: (error: Error) => {
      console.error('Apple Sign-In error:', error.message);
    },
  });

  // Phone Auth - Send verification code mutation
  const sendPhoneCodeMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      // Send phone verification request to backend
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/phone/send-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send verification code');
      }

      const data = await response.json();
      return { verificationId: data.verificationId, phoneNumber };
    },
    onError: (error: Error) => {
      console.error('Phone code send error:', error.message);
    },
  });

  // Phone Auth - Verify code and sign in mutation
  const verifyPhoneCodeMutation = useMutation({
    mutationFn: async ({ verificationId, verificationCode }: IPhoneSignInResult) => {
      // Verify code with backend
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/phone/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verificationId,
            code: verificationCode,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid verification code');
      }

      return response.json() as Promise<IAuthResponse>;
    },
    onSuccess: handleLoginSuccess,
    onError: (error: Error) => {
      console.error('Phone verification error:', error.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Cleanup notifications first
      await cleanupNotifications();

      // Then logout from services
      return authService.logout();
    },
    onSuccess: () => {
      setLogout();
      router.replace('/(auth)/login');

      // Clear all cached data
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.error('Logout error:', error.message);
      // Still logout locally even if API call fails
      setLogout();
      router.replace('/(auth)/login');
      queryClient.clear();
    },
  });

  // Get current user query
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: () => authService.refreshToken(),
    onSuccess: (token: string) => {
      setAuth((prev) => ({
        ...prev,
        token,
      }));
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<IAuthUser>) => authService.updateProfile(updates),
    onSuccess: (updatedUser: IAuthUser) => {
      // Update the auth atom with new user data
      setAuth((prev) => ({
        ...prev,
        user: updatedUser,
      }));

      // Invalidate auth queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: Error) => {
      console.error('Update profile error:', error.message);
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Cleanup notifications first
      await cleanupNotifications();

      return authService.deleteAccount();
    },
    onSuccess: () => {
      setLogout();
      router.replace('/(auth)/login');
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.error('Delete account error:', error.message);
    },
  });

  return {
    // State
    isAuthenticated,
    currentUser,
    userRole,
    user,
    isLoadingUser,

    // Methods
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginWithGoogle: googleSignInMutation.mutate,
    loginWithGoogleAsync: googleSignInMutation.mutateAsync,
    loginWithApple: appleSignInMutation.mutate,
    loginWithAppleAsync: appleSignInMutation.mutateAsync,
    sendPhoneCode: sendPhoneCodeMutation.mutateAsync,
    verifyPhoneCode: verifyPhoneCodeMutation.mutateAsync,
    logout: logoutMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutate,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingInWithGoogle: googleSignInMutation.isPending,
    isLoggingInWithApple: appleSignInMutation.isPending,
    isSendingPhoneCode: sendPhoneCodeMutation.isPending,
    isVerifyingPhoneCode: verifyPhoneCodeMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    googleSignInError: googleSignInMutation.error,
    appleSignInError: appleSignInMutation.error,
    phoneAuthError: sendPhoneCodeMutation.error || verifyPhoneCodeMutation.error,
    logoutError: logoutMutation.error,
    updateProfileError: updateProfileMutation.error,
    deleteAccountError: deleteAccountMutation.error,
  };
};
