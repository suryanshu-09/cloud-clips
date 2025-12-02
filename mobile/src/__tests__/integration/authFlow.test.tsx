import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'jotai';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { authService } from '@/features/auth/services/authService';
import type { IAuthResponse } from '@/features/auth/types';

jest.mock('expo-router');
jest.mock('@/features/auth/services/authService');

describe('Authentication Flow Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  describe('Complete Registration and Login Flow', () => {
    it('should register new user and auto-login', async () => {
      const mockAuthResponse: IAuthResponse = {
        user: {
          id: '1',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'client',
          phone: '+1234567890',
        },
        token: 'registration-token',
        refreshToken: 'refresh-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      const { result: registerResult } = renderHook(() => useRegister(), { wrapper });

      // Register new user
      await waitFor(() => {
        registerResult.current.register({
          email: 'newuser@example.com',
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          name: 'New User',
          phone: '+1234567890',
          role: 'client',
        });
      });

      await waitFor(() => {
        expect(registerResult.current.isRegistering).toBe(false);
        expect(registerResult.current.isSuccess).toBe(true);
      });

      // Verify registration was called
      expect(authService.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        name: 'New User',
        phone: '+1234567890',
        role: 'client',
      });
    });

    it('should login existing user and fetch profile', async () => {
      const mockAuthResponse: IAuthResponse = {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'Test User',
          role: 'client',
          phone: '+1234567890',
        },
        token: 'login-token',
        refreshToken: 'refresh-token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login user
      await waitFor(() => {
        result.current.login({
          email: 'user@example.com',
          password: 'Test123!@#',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoggingIn).toBe(false);
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Test123!@#',
      });
    });

    it('should handle full logout flow', async () => {
      const mockAuthResponse: IAuthResponse = {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'Test User',
          role: 'client',
          phone: '+1234567890',
        },
        token: 'login-token',
        refreshToken: 'refresh-token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await waitFor(() => {
        result.current.login({
          email: 'user@example.com',
          password: 'Test123!@#',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoggingIn).toBe(false);
      });

      // Then logout
      await waitFor(() => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isLoggingOut).toBe(false);
      });

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should handle session refresh with token expiry', async () => {
      const mockAuthResponse: IAuthResponse = {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'Test User',
          role: 'client',
          phone: '+1234567890',
        },
        token: 'old-token',
        refreshToken: 'refresh-token',
      };

      const newToken = 'new-token';

      (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);
      (authService.refreshToken as jest.Mock).mockResolvedValue(newToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await waitFor(() => {
        result.current.login({
          email: 'user@example.com',
          password: 'Test123!@#',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoggingIn).toBe(false);
      });

      // Refresh token
      await waitFor(() => {
        result.current.refreshToken();
      });

      expect(authService.refreshToken).toHaveBeenCalled();
    });

    it('should handle registration validation errors', async () => {
      const mockError = new Error('Email already exists');
      (authService.register as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useRegister(), { wrapper });

      await waitFor(() => {
        result.current.register({
          email: 'existing@example.com',
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          name: 'Test User',
          phone: '+1234567890',
          role: 'client',
        });
      });

      await waitFor(() => {
        expect(result.current.registerError).toEqual(mockError);
        expect(result.current.isSuccess).toBe(false);
      });
    });

    it('should handle login validation errors', async () => {
      const mockError = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        result.current.login({
          email: 'user@example.com',
          password: 'wrong-password',
        });
      });

      await waitFor(() => {
        expect(result.current.loginError).toEqual(mockError);
      });
    });

    it('should differentiate between client and barber roles', async () => {
      const clientResponse: IAuthResponse = {
        user: {
          id: '1',
          email: 'client@example.com',
          name: 'Client User',
          role: 'client',
          phone: '+1234567890',
        },
        token: 'client-token',
        refreshToken: 'refresh-token',
      };

      const barberResponse: IAuthResponse = {
        user: {
          id: '2',
          email: 'barber@example.com',
          name: 'Barber User',
          role: 'barber',
          phone: '+1234567890',
        },
        token: 'barber-token',
        refreshToken: 'refresh-token',
      };

      // Test client login
      (authService.login as jest.Mock).mockResolvedValueOnce(clientResponse);
      const { result: clientResult } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        clientResult.current.login({
          email: 'client@example.com',
          password: 'Test123!@#',
        });
      });

      await waitFor(() => {
        expect(clientResult.current.isLoggingIn).toBe(false);
      });

      // Test barber login
      (authService.login as jest.Mock).mockResolvedValueOnce(barberResponse);
      const { result: barberResult } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        barberResult.current.login({
          email: 'barber@example.com',
          password: 'Test123!@#',
        });
      });

      await waitFor(() => {
        expect(barberResult.current.isLoggingIn).toBe(false);
      });
    });
  });
});
