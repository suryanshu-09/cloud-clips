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

export interface IAuthResponse {
  user: IAuthUser;
  token: string;
  refreshToken: string;
}

export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'barber';
  profileImage?: string;
  isEmailVerified?: boolean;
}

export interface IAuthError {
  code: string;
  message: string;
}
