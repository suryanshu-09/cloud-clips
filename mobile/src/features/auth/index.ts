// Export all auth hooks
export { useAuth } from './hooks/useAuth';
export { useRegister, useForgotPassword } from './hooks/useRegister';

// Export auth service
export { authService } from './services/authService';

// Export auth types
export type {
  ILoginCredentials,
  IRegisterData,
  IForgotPasswordData,
  IAuthResponse,
  IAuthUser,
  IAuthError,
} from './types';
