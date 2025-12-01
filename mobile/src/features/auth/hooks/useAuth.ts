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
import type { ILoginCredentials, IAuthResponse, IAuthUser } from '../types';

/**
 * Main authentication hook
 * Provides auth state and methods
 */
export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Atoms
  const [auth, setAuth] = useAtom(authAtom);
  const setLogin = useSetAtom(loginAtom);
  const setLogout = useSetAtom(logoutAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const userRole = useAtomValue(userRoleAtom);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: ILoginCredentials) => authService.login(credentials),
    onSuccess: (data: IAuthResponse) => {
      setLogin({
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      });

      // Navigate based on user role
      if (data.user.role === 'barber') {
        router.replace('/(barber)');
      } else {
        router.replace('/(client)');
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: Error) => {
      console.error('Login error:', error.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setLogout();
      router.replace('/(auth)/login');

      // Clear all cached data
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.error('Logout error:', error.message);
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

  return {
    // State
    isAuthenticated,
    currentUser,
    userRole,
    user,
    isLoadingUser,

    // Methods
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
};
