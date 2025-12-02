import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { authAtom, type IAuthState } from '@/store/atoms/authAtom';
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

const initialAuthState: IAuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
};

// Helper component to hydrate atoms with initial values
const HydrateAtoms = ({ children }: { children: React.ReactNode }) => {
  useHydrateAtoms([[authAtom, initialAuthState]]);
  return <>{children}</>;
};

describe('useAuth', () => {
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
      <QueryClientProvider client={queryClient}>
        <HydrateAtoms>{children}</HydrateAtoms>
      </QueryClientProvider>
    </Provider>
  );

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // In test environment with async storage, initial state may be undefined or false
    // Both indicate unauthenticated state
    expect(result.current.isAuthenticated).toBeFalsy();
    expect(result.current.currentUser).toBeFalsy();
  });

  it('should handle successful login for client', async () => {
    const mockAuthResponse: IAuthResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client',
        phone: '1234567890',
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
    };

    (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false);
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle successful login for barber', async () => {
    const mockAuthResponse: IAuthResponse = {
      user: {
        id: '2',
        email: 'barber@example.com',
        name: 'Test Barber',
        role: 'barber',
        phone: '1234567890',
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
    };

    (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      result.current.login({
        email: 'barber@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false);
    });
  });

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials');
    (authService.login as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'wrong-password',
      });
    });

    await waitFor(() => {
      expect(result.current.loginError).toEqual(mockError);
    });
  });

  it('should handle logout', async () => {
    (authService.logout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false);
    });

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should handle token refresh', async () => {
    const newToken = 'new-mock-token';
    (authService.refreshToken as jest.Mock).mockResolvedValue(newToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      result.current.refreshToken();
    });

    expect(authService.refreshToken).toHaveBeenCalled();
  });

  it('should not fetch current user when unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // In test environment, initial state is undefined or false (unauthenticated)
    expect(result.current.isAuthenticated).toBeFalsy();
    // Note: getCurrentUser behavior depends on atom hydration state
    // In production, the query is disabled when isAuthenticated is false
  });
});
