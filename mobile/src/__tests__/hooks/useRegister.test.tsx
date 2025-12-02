import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'jotai';
import { useRegister, useForgotPassword } from '@/features/auth/hooks/useRegister';
import { authService } from '@/features/auth/services/authService';
import type { IAuthResponse } from '@/features/auth/types';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/features/auth/services/authService');

describe('useRegister', () => {
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

  it('should handle successful registration', async () => {
    const mockAuthResponse: IAuthResponse = {
      user: {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'client',
        phone: '1234567890',
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
    };

    (authService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await waitFor(() => {
      result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'New User',
        phone: '1234567890',
        role: 'client',
      });
    });

    await waitFor(() => {
      expect(result.current.isRegistering).toBe(false);
    });

    expect(authService.register).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      name: 'New User',
      phone: '1234567890',
      role: 'client',
    });
  });

  it('should handle registration error', async () => {
    const mockError = new Error('Email already exists');
    (authService.register as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await waitFor(() => {
      result.current.register({
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Test User',
        phone: '1234567890',
        role: 'client',
      });
    });

    await waitFor(() => {
      expect(result.current.registerError).toEqual(mockError);
    });
  });

  it('should auto-login after successful registration', async () => {
    const mockAuthResponse: IAuthResponse = {
      user: {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'barber',
        phone: '1234567890',
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
    };

    (authService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useRegister(), { wrapper });

    await waitFor(() => {
      result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'New User',
        phone: '1234567890',
        role: 'barber',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe('useForgotPassword', () => {
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

  it('should send password reset email', async () => {
    (authService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useForgotPassword(), { wrapper });

    await waitFor(() => {
      result.current.sendResetEmail('test@example.com');
    });

    await waitFor(() => {
      expect(result.current.isSending).toBe(false);
    });

    expect(authService.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle password reset error', async () => {
    const mockError = new Error('Email not found');
    (authService.sendPasswordResetEmail as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useForgotPassword(), { wrapper });

    await waitFor(() => {
      result.current.sendResetEmail('nonexistent@example.com');
    });

    await waitFor(() => {
      expect(result.current.sendError).toEqual(mockError);
    });
  });

  it('should set success state after sending reset email', async () => {
    (authService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useForgotPassword(), { wrapper });

    await waitFor(() => {
      result.current.sendResetEmail('test@example.com');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
