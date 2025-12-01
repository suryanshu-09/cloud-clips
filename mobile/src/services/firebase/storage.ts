import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
  UploadTask,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { app } from './config';

// Initialize Firebase Storage
let storage: FirebaseStorage | null = null;

if (app) {
  storage = getStorage(app);
}

export interface IUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

// Storage service functions
export const storageService = {
  // Upload file from blob/uri
  uploadFile: async (
    path: string,
    blob: Blob,
    onProgress?: (progress: IUploadProgress) => void
  ): Promise<string> => {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    const storageRef = ref(storage, path);

    if (onProgress) {
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            onProgress(progress);
          },
          (error) => {
            console.error('[Storage] Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      // Simple upload without progress
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    }
  },

  // Upload image from URI (React Native)
  uploadImage: async (
    path: string,
    uri: string,
    onProgress?: (progress: IUploadProgress) => void
  ): Promise<string> => {
    // Fetch the image as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    return await storageService.uploadFile(path, blob, onProgress);
  },

  // Upload user avatar
  uploadAvatar: async (
    userId: string,
    uri: string,
    onProgress?: (progress: IUploadProgress) => void
  ): Promise<string> => {
    const path = `avatars/${userId}/${Date.now()}.jpg`;
    return await storageService.uploadImage(path, uri, onProgress);
  },

  // Upload barber portfolio image
  uploadPortfolioImage: async (
    barberId: string,
    uri: string,
    onProgress?: (progress: IUploadProgress) => void
  ): Promise<string> => {
    const path = `portfolio/${barberId}/${Date.now()}.jpg`;
    return await storageService.uploadImage(path, uri, onProgress);
  },

  // Upload product image
  uploadProductImage: async (
    productId: string,
    uri: string,
    onProgress?: (progress: IUploadProgress) => void
  ): Promise<string> => {
    const path = `products/${productId}/${Date.now()}.jpg`;
    return await storageService.uploadImage(path, uri, onProgress);
  },

  // Upload chat image
  uploadChatImage: async (
    appointmentId: string,
    uri: string,
    onProgress?: (progress: IUploadProgress) => void
  ): Promise<string> => {
    const path = `chat/${appointmentId}/${Date.now()}.jpg`;
    return await storageService.uploadImage(path, uri, onProgress);
  },

  // Delete file
  deleteFile: async (path: string): Promise<void> => {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  // Delete file by URL
  deleteFileByURL: async (url: string): Promise<void> => {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    // Extract path from URL
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
    if (!url.startsWith(baseUrl)) {
      throw new Error('Invalid Firebase Storage URL');
    }

    const encodedPath = url.replace(baseUrl, '').split('?')[0];
    const path = decodeURIComponent(encodedPath);

    await storageService.deleteFile(path);
  },

  // Get download URL
  getDownloadURL: async (path: string): Promise<string> => {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  },
};

export { storage };
export default storageService;
