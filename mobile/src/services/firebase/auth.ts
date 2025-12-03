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
  onAuthStateChanged,
  Auth,
  User,
  UserCredential,
  Unsubscribe,
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
};

export type { IGoogleSignInResult, IAppleSignInResult };
export { auth };
export default authService;
