import { useSetAtom } from 'jotai';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { loginAtom } from '@/store/atoms/authAtom';
import { authService } from '../services/authService';
import type { IRegisterData, IAuthResponse } from '../types';

/**
 * Registration hook
 * Handles user registration flow
 */
export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setLogin = useSetAtom(loginAtom);

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: IRegisterData) => authService.register(data),
    onSuccess: (data: IAuthResponse) => {
      // Auto-login after successful registration
      setLogin({
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      });

      // Navigate to onboarding or home based on role
      if (data.user.role === 'barber') {
        router.replace('/(barber)');
      } else {
        router.replace('/(client)');
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: Error) => {
      console.error('Registration error:', error.message);
    },
  });

  return {
    // Methods
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,

    // Loading state
    isRegistering: registerMutation.isPending,

    // Error
    registerError: registerMutation.error,

    // Success
    isSuccess: registerMutation.isSuccess,
  };
};

/**
 * Forgot password hook
 * Handles password reset flow
 */
export const useForgotPassword = () => {
  const sendResetEmailMutation = useMutation({
    mutationFn: (email: string) => authService.sendPasswordResetEmail(email),
    onError: (error: Error) => {
      console.error('Forgot password error:', error.message);
    },
  });

  return {
    // Methods
    sendResetEmail: sendResetEmailMutation.mutate,
    sendResetEmailAsync: sendResetEmailMutation.mutateAsync,

    // Loading state
    isSending: sendResetEmailMutation.isPending,

    // Error
    sendError: sendResetEmailMutation.error,

    // Success
    isSuccess: sendResetEmailMutation.isSuccess,
  };
};
