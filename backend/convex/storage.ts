/**
 * Convex File Storage Configuration
 * 
 * This file defines the storage structure for Cloud Clips.
 * Files are stored using Convex's built-in storage system.
 * 
 * Storage Areas (by convention in path structure):
 * - profilePictures: User profile avatars (path: users/{userId}/profile/{filename})
 * - portfolioImages: Barber portfolio/work samples (path: barbers/{userId}/portfolio/{filename})
 * - productPhotos: Product marketplace images (path: products/{userId}/{filename})
 * - reviewPhotos: Review photos from clients (path: reviews/{userId}/{filename})
 * - messageAttachments: Chat images and files (path: messages/{userId}/{filename})
 * 
 * File Limits:
 * - Profile pictures: 5MB max, JPEG/PNG/WebP only
 * - Portfolio images: 10MB max, JPEG/PNG/WebP only
 * - Product photos: 10MB max, JPEG/PNG/WebP only
 * - Review photos: 10MB max, JPEG/PNG/WebP only
 * - Message attachments: 25MB max, Images/PDF/Audio
 */

// Storage configuration constants
export const STORAGE_CONFIG = {
  profilePictures: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    pathPrefix: "users",
    subfolder: "profile",
  },
  portfolioImages: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    pathPrefix: "barbers",
    subfolder: "portfolio",
  },
  productPhotos: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    pathPrefix: "products",
  },
  reviewPhotos: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    pathPrefix: "reviews",
  },
  messageAttachments: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
    ] as const,
    pathPrefix: "messages",
  },
} as const;

// Type for storage areas
export type StorageArea = keyof typeof STORAGE_CONFIG;

// Helper to build storage path
export function buildStoragePath(
  area: StorageArea,
  userId: string,
  fileName: string
): string {
  const config = STORAGE_CONFIG[area];
  if (config.subfolder) {
    return `${config.pathPrefix}/${userId}/${config.subfolder}/${fileName}`;
  }
  return `${config.pathPrefix}/${userId}/${fileName}`;
}

// Helper to validate file type
export function isValidFileType(
  area: StorageArea,
  mimeType: string
): boolean {
  const config = STORAGE_CONFIG[area];
  return config.allowedMimeTypes.includes(mimeType as any);
}

// Helper to validate file size
export function isValidFileSize(
  area: StorageArea,
  fileSize: number
): boolean {
  const config = STORAGE_CONFIG[area];
  return fileSize <= config.maxFileSize;
}

// Helper to validate file ownership
export function isFileOwner(
  path: string,
  userId: string
): boolean {
  // Check if the path starts with a prefix that includes the userId
  const ownershipPatterns = [
    `users/${userId}/`,
    `barbers/${userId}/`,
    `products/${userId}/`,
    `reviews/${userId}/`,
    `messages/${userId}/`,
  ];
  
  return ownershipPatterns.some((pattern) => path.startsWith(pattern));
}
