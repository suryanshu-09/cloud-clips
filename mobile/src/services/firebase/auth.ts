import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  Auth,
  User,
  UserCredential,
} from 'firebase/auth';
import { app } from './config';

// Initialize Firebase Auth
let auth: Auth | null = null;

if (app) {
  auth = getAuth(app);
}

// Auth service functions
export const authService = {
  // Get current user
  getCurrentUser: (): User | null => {
    return auth?.currentUser || null;
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

  // Delete user account
  deleteAccount: async (): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await auth.currentUser.delete();
  },
};

export { auth };
export default authService;
