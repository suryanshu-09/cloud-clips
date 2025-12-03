import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import apiClient from '../api/client';
import { storageService } from '../firebase/storage';

// Types
export interface IUploadedMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface IUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

export interface IImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

export interface IUploadOptions {
  category?: 'avatars' | 'gallery' | 'products' | 'reviews' | 'misc';
  generateThumbs?: boolean;
  resize?: boolean;
  onProgress?: (progress: IUploadProgress) => void;
}

// Default options
const DEFAULT_IMAGE_OPTIONS: IImagePickerOptions = {
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
};

// Check and request camera permissions
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Camera Permission Required', 'Please grant camera permission to take photos.', [
      { text: 'OK' },
    ]);
    return false;
  }
  return true;
}

// Check and request media library permissions
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Photo Library Permission Required',
      'Please grant photo library permission to select photos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

// Pick image from camera
export async function pickImageFromCamera(
  options: IImagePickerOptions = {}
): Promise<ImagePicker.ImagePickerAsset | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    ...DEFAULT_IMAGE_OPTIONS,
    ...options,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0];
}

// Pick image from gallery
export async function pickImageFromGallery(
  options: IImagePickerOptions = {}
): Promise<ImagePicker.ImagePickerAsset | null> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    ...DEFAULT_IMAGE_OPTIONS,
    ...options,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0];
}

// Pick multiple images from gallery
export async function pickMultipleImages(
  options: IImagePickerOptions = {}
): Promise<ImagePicker.ImagePickerAsset[]> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    ...DEFAULT_IMAGE_OPTIONS,
    allowsMultipleSelection: true,
    selectionLimit: options.selectionLimit || 10,
    ...options,
    allowsEditing: false, // Can't edit when selecting multiple
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  return result.assets;
}

// Show image picker action sheet
export function showImagePickerOptions(
  onCameraPress: () => void,
  onGalleryPress: () => void,
  onCancel?: () => void
) {
  Alert.alert('Select Photo', 'Choose where to get your photo from', [
    { text: 'Camera', onPress: onCameraPress },
    { text: 'Photo Library', onPress: onGalleryPress },
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
  ]);
}

// Get file info from URI
export async function getFileInfo(uri: string): Promise<{ size: number; exists: boolean } | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return {
      size: (info as any).size || 0,
      exists: info.exists,
    };
  } catch (error) {
    console.error('[Media] Error getting file info:', error);
    return null;
  }
}

// Convert URI to FormData for upload
function createFormData(
  uri: string,
  fieldName: string = 'file',
  additionalFields?: Record<string, string>
): FormData {
  const formData = new FormData();

  // Get file name and type from URI
  const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // Append file
  formData.append(fieldName, {
    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    name: filename,
    type,
  } as any);

  // Append additional fields
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return formData;
}

// Media upload service
export const mediaService = {
  // Upload avatar
  uploadAvatar: async (uri: string, options: IUploadOptions = {}): Promise<IUploadedMedia> => {
    const formData = createFormData(uri, 'file');

    try {
      const response = await apiClient.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            options.onProgress({
              bytesTransferred: progressEvent.loaded,
              totalBytes: progressEvent.total,
              progress: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('[Media] Avatar upload failed:', error);
      throw error;
    }
  },

  // Upload gallery image
  uploadGalleryImage: async (
    uri: string,
    imageType: string = 'after',
    options: IUploadOptions = {}
  ): Promise<IUploadedMedia & { type: string }> => {
    const formData = createFormData(uri, 'file', { type: imageType });

    try {
      const response = await apiClient.post('/uploads/gallery', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            options.onProgress({
              bytesTransferred: progressEvent.loaded,
              totalBytes: progressEvent.total,
              progress: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('[Media] Gallery upload failed:', error);
      throw error;
    }
  },

  // Upload multiple gallery images
  uploadGalleryBatch: async (
    uris: string[],
    options: IUploadOptions = {}
  ): Promise<{ uploaded: IUploadedMedia[]; failed: { uri: string; error: string }[] }> => {
    const formData = new FormData();

    uris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `image_${index}_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('files', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type,
      } as any);
    });

    try {
      const response = await apiClient.post('/uploads/gallery/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            options.onProgress({
              bytesTransferred: progressEvent.loaded,
              totalBytes: progressEvent.total,
              progress: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      });

      return {
        uploaded: response.data.uploaded || [],
        failed: response.data.failed || [],
      };
    } catch (error) {
      console.error('[Media] Batch gallery upload failed:', error);
      throw error;
    }
  },

  // Upload product image
  uploadProductImage: async (
    uri: string,
    productId?: string,
    options: IUploadOptions = {}
  ): Promise<IUploadedMedia> => {
    const additionalFields: Record<string, string> = {};
    if (productId) {
      additionalFields.productId = productId;
    }

    const formData = createFormData(uri, 'file', additionalFields);

    try {
      const response = await apiClient.post('/uploads/product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            options.onProgress({
              bytesTransferred: progressEvent.loaded,
              totalBytes: progressEvent.total,
              progress: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('[Media] Product image upload failed:', error);
      throw error;
    }
  },

  // Upload review photos
  uploadReviewPhotos: async (
    uris: string[],
    options: IUploadOptions = {}
  ): Promise<{ photos: string[]; failed: { uri: string; error: string }[] }> => {
    // Limit to 3 photos
    const limitedUris = uris.slice(0, 3);

    const formData = new FormData();

    limitedUris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `review_${index}_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('files', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type,
      } as any);
    });

    try {
      const response = await apiClient.post('/uploads/review', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            options.onProgress({
              bytesTransferred: progressEvent.loaded,
              totalBytes: progressEvent.total,
              progress: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      });

      return {
        photos: response.data.photos || [],
        failed: response.data.failed || [],
      };
    } catch (error) {
      console.error('[Media] Review photos upload failed:', error);
      throw error;
    }
  },

  // Generic upload
  uploadFile: async (uri: string, options: IUploadOptions = {}): Promise<IUploadedMedia> => {
    const additionalFields: Record<string, string> = {};
    if (options.category) {
      additionalFields.category = options.category;
    }
    if (options.generateThumbs !== undefined) {
      additionalFields.generateThumbs = String(options.generateThumbs);
    }
    if (options.resize !== undefined) {
      additionalFields.resize = String(options.resize);
    }

    const formData = createFormData(uri, 'file', additionalFields);

    try {
      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            options.onProgress({
              bytesTransferred: progressEvent.loaded,
              totalBytes: progressEvent.total,
              progress: (progressEvent.loaded / progressEvent.total) * 100,
            });
          }
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('[Media] File upload failed:', error);
      throw error;
    }
  },

  // Delete image
  deleteImage: async (url: string): Promise<void> => {
    try {
      await apiClient.delete('/uploads', {
        data: { url },
      });
    } catch (error) {
      console.error('[Media] Delete failed:', error);
      throw error;
    }
  },

  // Firebase storage fallback methods (when backend upload fails)
  uploadToFirebase: {
    avatar: async (
      userId: string,
      uri: string,
      onProgress?: (progress: IUploadProgress) => void
    ): Promise<string> => {
      return storageService.uploadAvatar(userId, uri, onProgress);
    },

    gallery: async (
      barberId: string,
      uri: string,
      onProgress?: (progress: IUploadProgress) => void
    ): Promise<string> => {
      return storageService.uploadPortfolioImage(barberId, uri, onProgress);
    },

    product: async (
      productId: string,
      uri: string,
      onProgress?: (progress: IUploadProgress) => void
    ): Promise<string> => {
      return storageService.uploadProductImage(productId, uri, onProgress);
    },
  },
};

export default mediaService;
