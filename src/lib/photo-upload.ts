import { supabase } from './supabase';

export interface PhotoUploadOptions {
  bucket: 'avatars' | 'walk-moments';
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

const DEFAULT_OPTIONS: Partial<PhotoUploadOptions> = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
};

/**
 * Validates a file before upload
 */
function validateFile(file: File, options: PhotoUploadOptions): string | null {
  const { maxSizeBytes, allowedTypes } = { ...DEFAULT_OPTIONS, ...options };

  if (!file) {
    return 'No file provided';
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    return `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return `File type not supported. Please use: ${allowedTypes.join(', ')}`;
  }

  return null;
}

/**
 * Generates a unique file path
 */
function generateFilePath(bucket: string, folder: string, fileName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedFileName = `${timestamp}_${randomString}.${extension}`;

  if (bucket === 'avatars') {
    return `${userId}/${sanitizedFileName}`;
  }

  return folder ? `${folder}/${userId}/${sanitizedFileName}` : `${userId}/${sanitizedFileName}`;
}

/**
 * Uploads a photo to Supabase Storage
 */
export async function uploadPhoto(
  file: File,
  userId: string,
  options: PhotoUploadOptions
): Promise<PhotoUploadResult> {
  try {
    // Validate file
    const validationError = validateFile(file, options);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Generate file path
    const filePath = generateFilePath(
      options.bucket,
      options.folder || '',
      file.name,
      userId
    );

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Deletes a photo from Supabase Storage
 */
export async function deletePhoto(
  bucket: 'avatars' | 'walk-moments',
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Helper function to upload profile picture
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<PhotoUploadResult> {
  return uploadPhoto(file, userId, {
    bucket: 'avatars',
    maxSizeBytes: 2 * 1024 * 1024, // 2MB for profile pictures
  });
}

/**
 * Helper function to upload walk moment photo
 */
export async function uploadMomentPhoto(
  file: File,
  userId: string,
  walkId?: string
): Promise<PhotoUploadResult> {
  return uploadPhoto(file, userId, {
    bucket: 'walk-moments',
    folder: walkId || 'general',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB for moment photos
  });
}

/**
 * Helper to extract file path from Supabase URL
 */
export function extractFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const bucketIndex = pathSegments.findIndex(segment => segment === bucket);
    
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Image compression utility for large images
 */
export function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
} 