import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  onAuthStateChanged,
  Auth,
  User,
  UserCredential,
  Unsubscribe,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { app } from './config';

// Initialize Firebase Auth
let auth: Auth | null = null;

if (app) {
  auth = getAuth(app);
}

/**
 * Google Sign-In configuration
 * Note: Requires @react-native-google-signin/google-signin package
 * and proper configuration in app.json
 */
interface IGoogleSignInResult {
  idToken: string;
  user: {
    email: string;
    familyName: string | null;
    givenName: string | null;
    id: string;
    name: string | null;
    photo: string | null;
  };
}

/**
 * Apple Sign-In result
 * Note: Requires expo-apple-authentication package
 */
interface IAppleSignInResult {
  identityToken: string;
  nonce?: string;
  fullName?: {
    givenName: string | null;
    familyName: string | null;
  };
  email?: string | null;
}

/**
 * Phone Sign-In result for verification code confirmation
 */
interface IPhoneSignInResult {
  verificationId: string;
  verificationCode: string;
}

/**
 * Phone verification state
 */
interface IPhoneVerificationState {
  verificationId: string;
  phoneNumber: string;
}

// Auth service functions with Google and Apple Sign-In support
export const authService = {
  // Get current user
  getCurrentUser: (): User | null => {
    return auth?.currentUser || null;
  },

  // Check if Firebase Auth is initialized
  isInitialized: (): boolean => {
    return auth !== null;
  },

  // Subscribe to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void): Unsubscribe | null => {
    if (!auth) {
      console.warn('[Firebase Auth] Auth not initialized, cannot subscribe to state changes');
      return null;
    }
    return onAuthStateChanged(auth, callback);
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    return await signInWithEmailAndPassword(auth, email, password);
  },

  // Sign up with email and password
  signUp: async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    return userCredential;
  },

  /**
   * Sign in with Google
   * Requires Google Sign-In to be configured and the user to have signed in via GoogleSignin
   * @param googleSignInResult The result from GoogleSignin.signIn()
   */
  signInWithGoogle: async (googleSignInResult: IGoogleSignInResult): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    const { idToken } = googleSignInResult;
    if (!idToken) {
      throw new Error('No ID token present in Google Sign-In result');
    }

    // Create Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase with the Google credential
    return await signInWithCredential(auth, googleCredential);
  },

  /**
   * Sign in with Apple
   * Only available on iOS
   * @param appleSignInResult The result from AppleAuthentication.signInAsync()
   */
  signInWithApple: async (appleSignInResult: IAppleSignInResult): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const { identityToken, nonce } = appleSignInResult;
    if (!identityToken) {
      throw new Error('No identity token present in Apple Sign-In result');
    }

    // Create Apple OAuth provider
    const appleProvider = new OAuthProvider('apple.com');

    // Create credential with the token
    const appleCredential = appleProvider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });

    // Sign in to Firebase with the Apple credential
    const userCredential = await signInWithCredential(auth, appleCredential);

    // Update profile with name if available (Apple only provides name on first sign-in)
    if (appleSignInResult.fullName && userCredential.user) {
      const { givenName, familyName } = appleSignInResult.fullName;
      if (givenName || familyName) {
        const displayName = [givenName, familyName].filter(Boolean).join(' ');
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
    }

    return userCredential;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    await signOut(auth);
  },

  // Send password reset email
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    await sendPasswordResetEmail(auth, email);
  },

  // Update user profile
  updateProfile: async (updates: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updateProfile(auth.currentUser, updates);
  },

  // Update email
  updateEmail: async (newEmail: string): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updateEmail(auth.currentUser, newEmail);
  },

  // Update password
  updatePassword: async (newPassword: string): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updatePassword(auth.currentUser, newPassword);
  },

  // Get ID token
  getIdToken: async (forceRefresh = false): Promise<string | null> => {
    if (!auth?.currentUser) {
      return null;
    }
    return await auth.currentUser.getIdToken(forceRefresh);
  },

  // Get the current user's Firebase UID
  getFirebaseUid: (): string | null => {
    return auth?.currentUser?.uid || null;
  },

  // Reload user data from Firebase
  reloadUser: async (): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await auth.currentUser.reload();
  },

  // Check if email is verified
  isEmailVerified: (): boolean => {
    return auth?.currentUser?.emailVerified || false;
  },

  // Send email verification
  sendEmailVerification: async (): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    const { sendEmailVerification: sendVerification } = await import('firebase/auth');
    await sendVerification(auth.currentUser);
  },

  // Delete user account
  deleteAccount: async (): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await auth.currentUser.delete();
  },

  /**
   * Send phone verification code
   * Note: On native platforms, this requires Firebase Auth with reCAPTCHA verification
   * For Expo, we'll use the backend to send SMS and verify OTP
   * @param phoneNumber Phone number in E.164 format (e.g., +14155551234)
   * @param recaptchaVerifier Optional reCAPTCHA verifier (required for web)
   */
  sendPhoneVerificationCode: async (
    phoneNumber: string,
    recaptchaVerifier?: ApplicationVerifier
  ): Promise<ConfirmationResult | null> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +14155551234)');
    }

    // On web, we need a reCAPTCHA verifier
    if (Platform.OS === 'web' && !recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier is required for web platform');
    }

    try {
      // Use Firebase's signInWithPhoneNumber which handles SMS sending
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier as ApplicationVerifier
      );
      return confirmationResult;
    } catch (error: any) {
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('reCAPTCHA verification failed. Please try again');
      }
      throw error;
    }
  },

  /**
   * Verify phone number with OTP code
   * @param confirmationResult The confirmation result from sendPhoneVerificationCode
   * @param verificationCode The 6-digit verification code from SMS
   */
  confirmPhoneVerificationCode: async (
    confirmationResult: ConfirmationResult,
    verificationCode: string
  ): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    // Validate verification code format
    if (!/^\d{6}$/.test(verificationCode)) {
      throw new Error('Invalid verification code. Please enter the 6-digit code');
    }

    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      return userCredential;
    } catch (error: any) {
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please check and try again');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Verification code has expired. Please request a new code');
      }
      throw error;
    }
  },

  /**
   * Sign in with phone credential (alternative method using verificationId directly)
   * @param verificationId The verification ID from phone auth
   * @param verificationCode The 6-digit OTP code
   */
  signInWithPhoneCredential: async (
    verificationId: string,
    verificationCode: string
  ): Promise<UserCredential> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    // Create phone credential
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);

    // Sign in with the credential
    return await signInWithCredential(auth, credential);
  },
};

export type {
  IGoogleSignInResult,
  IAppleSignInResult,
  IPhoneSignInResult,
  IPhoneVerificationState,
};
export { auth, PhoneAuthProvider };
export default authService;
