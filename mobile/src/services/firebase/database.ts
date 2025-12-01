import { getDatabase, Database } from 'firebase/database';
import app from './config';

/**
 * Firebase Realtime Database Service
 *
 * Provides access to Firebase Realtime Database for real-time chat functionality.
 *
 * Features:
 * - Real-time message synchronization
 * - Offline persistence
 * - Automatic reconnection
 *
 * Usage:
 * ```typescript
 * import { database } from '@/services/firebase/database';
 * import { ref, onValue } from 'firebase/database';
 *
 * const messagesRef = ref(database, 'messages');
 * onValue(messagesRef, (snapshot) => {
 *   const data = snapshot.val();
 *   // Handle messages
 * });
 * ```
 */

let database: Database | null = null;

/**
 * Initialize Firebase Realtime Database
 * @returns Database instance or null if Firebase is not configured
 */
const initializeDatabase = (): Database | null => {
  try {
    if (!app) {
      // Silent in production, only warn once in dev
      return null;
    }

    // Initialize database
    database = getDatabase(app);
    console.log('[Firebase Database] Initialized successfully');
    return database;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[Firebase Database] Not configured. Set Firebase credentials in .env to enable real-time chat.'
      );
    }
    return null;
  }
};

// Export initialized database
export const db = initializeDatabase();

export default db;
