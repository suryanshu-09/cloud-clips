export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  role: 'client' | 'barber';
}

export interface IForgotPasswordData {
  email: string;
}

export interface IResetPasswordData {
  token: string;
  newPassword: string;
}

export interface IAuthResponse {
  user: IAuthUser;
  token: string;
  refreshToken: string;
}

export interface IOAuthResponse {
  user: IAuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  isNewUser: boolean;
}

export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'barber';
  profileImage?: string;
  avatar?: string;
  emailVerified?: boolean;
  authProvider?: 'email' | 'google' | 'apple' | 'firebase';
  barberProfileId?: string; // ID of associated barber profile for barber users
}

export interface IAuthError {
  code: string;
  message: string;
}

export interface IGoogleAuthData {
  idToken: string;
}

export interface IAppleAuthData {
  identityToken: string;
  fullName?: string;
  email?: string;
}
