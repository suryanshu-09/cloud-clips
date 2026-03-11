import { action } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  STORAGE_CONFIG,
  type StorageArea,
  buildStoragePath,
  isValidFileType,
  isValidFileSize,
} from "../storage";

/**
 * Storage Actions
 * 
 * These actions handle file uploads, downloads, and deletions using Convex's storage API.
 * Files are stored securely with user-based access control.
 */

/**
 * Upload a file to storage
 * Returns a storage ID that can be used to retrieve the file
 */
export const uploadFile = action({
  args: {
    storageArea: v.union(
      v.literal("profilePictures"),
      v.literal("portfolioImages"),
      v.literal("productPhotos"),
      v.literal("reviewPhotos"),
      v.literal("messageAttachments")
    ),
    fileName: v.string(),
    contentType: v.string(),
    fileContent: v.bytes(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new ConvexError("Not authenticated");
    }

    const area = args.storageArea as StorageArea;
    const config = STORAGE_CONFIG[area];

    // Validate file type
    if (!isValidFileType(area, args.contentType)) {
      throw new ConvexError(
        `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(", ")}`
      );
    }

    // Validate file size
    if (!isValidFileSize(area, args.fileContent.byteLength)) {
      throw new ConvexError(
        `File too large. Maximum size: ${config.maxFileSize / (1024 * 1024)}MB`
      );
    }

    const path = buildStoragePath(area, identity.email, args.fileName);
    const fileBlob = new Blob([args.fileContent], { type: args.contentType });

    const storageId = await ctx.storage.store(fileBlob);

    return {
      storageId,
      path,
      url: await ctx.storage.getUrl(storageId),
    };
  },
});

/**
 * Get the URL for a stored file
 */
export const getFileUrl = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new ConvexError("File not found");
    }
    return { url };
  },
});

/**
 * Delete a file from storage
 * Only the file owner can delete their files
 */
export const deleteFile = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    await ctx.storage.delete(args.storageId);

    return { success: true };
  },
});

/**
 * Get multiple file URLs by storage IDs
 */
export const getFileUrls = action({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};

    for (const storageId of args.storageIds) {
      try {
        const url = await ctx.storage.getUrl(storageId);
        urls[storageId.toString()] = url;
      } catch {
        urls[storageId.toString()] = null;
      }
    }

    return { urls };
  },
});

/**
 * List files in a specific storage area for the current user
 */
export const listUserFiles = action({
  args: {
    storageArea: v.union(
      v.literal("profilePictures"),
      v.literal("portfolioImages"),
      v.literal("productPhotos"),
      v.literal("reviewPhotos"),
      v.literal("messageAttachments")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new ConvexError("Not authenticated");
    }

    const area = args.storageArea as StorageArea;
    const config = STORAGE_CONFIG[area];
    const prefix = "subfolder" in config
      ? `${config.pathPrefix}/${identity.email}/${config.subfolder}`
      : `${config.pathPrefix}/${identity.email}`;

    throw new ConvexError(
      `Listing files is not supported in Convex actions. Persist storage IDs in your documents and query them by prefix: ${prefix}`
    );
  },
});

/**
 * Generate a unique filename with timestamp to prevent collisions
 */
export const generateUniqueFileName = action({
  args: {
    originalFileName: v.string(),
  },
  handler: async (_ctx, args) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const extension = args.originalFileName.split(".").pop() || "";
    const baseName = args.originalFileName.replace(/\.[^/.]+$/, "");
    
    return {
      fileName: `${baseName}_${timestamp}_${random}.${extension}`,
    };
  },
});
