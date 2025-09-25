/**
 * Enhanced image upload service for profile images
 */
import { Alert } from 'react-native';
import ImagePicker, { ImageOrVideo, MediaType } from 'react-native-image-crop-picker';
import CloudflareUploadService from '../services/CloudflareUploadService';
import { handleProfileImageUploadResult } from './ProfileImageUtils';

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImagePickerOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowsEditing?: boolean;
}

/**
 * Default options for profile image picker
 */
const DEFAULT_PROFILE_IMAGE_OPTIONS: ImagePickerOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  allowsEditing: true
};

/**
 * Show image picker options (camera or gallery)
 */
export const showImagePickerOptions = (): Promise<ImageOrVideo | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to select your profile picture',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const image = await openCamera(DEFAULT_PROFILE_IMAGE_OPTIONS);
              resolve(image);
            } catch (error) {
              console.error('Camera picker error:', error);
              resolve(null);
            }
          }
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const image = await openImagePicker(DEFAULT_PROFILE_IMAGE_OPTIONS);
              resolve(image);
            } catch (error) {
              console.error('Gallery picker error:', error);
              resolve(null);
            }
          }
        }
      ]
    );
  });
};

/**
 * Open camera for image capture
 */
export const openCamera = async (options: ImagePickerOptions = {}): Promise<ImageOrVideo> => {
  const pickerOptions = {
    width: options.maxWidth || 800,
    height: options.maxHeight || 800,
    cropping: options.allowsEditing !== false,
    cropperCircleOverlay: true,
    compressImageQuality: options.quality || 0.8,
    mediaType: 'photo' as MediaType,
    includeBase64: false,
    enableRotationGesture: true,
    freeStyleCropEnabled: true,
  };

  return ImagePicker.openCamera(pickerOptions);
};

/**
 * Open image picker from gallery
 */
export const openImagePicker = async (options: ImagePickerOptions = {}): Promise<ImageOrVideo> => {
  const pickerOptions = {
    width: options.maxWidth || 800,
    height: options.maxHeight || 800,
    cropping: options.allowsEditing !== false,
    cropperCircleOverlay: true,
    compressImageQuality: options.quality || 0.8,
    mediaType: 'photo' as MediaType,
    includeBase64: false,
    enableRotationGesture: true,
    freeStyleCropEnabled: true,
  };

  return ImagePicker.openPicker(pickerOptions);
};

/**
 * Validate image before upload
 */
export const validateImage = (image: ImageOrVideo): { isValid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (image.size && image.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size must be less than 5MB. Please select a smaller image.'
    };
  }

  // Check image dimensions
  if (image.width && image.height) {
    const minDimension = 100;
    const maxDimension = 2048;

    if (image.width < minDimension || image.height < minDimension) {
      return {
        isValid: false,
        error: 'Image dimensions must be at least 100x100 pixels.'
      };
    }

    if (image.width > maxDimension || image.height > maxDimension) {
      return {
        isValid: false,
        error: 'Image dimensions must be less than 2048x2048 pixels.'
      };
    }
  }

  // Check mime type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (image.mime && !allowedTypes.includes(image.mime.toLowerCase())) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP).'
    };
  }

  return { isValid: true };
};

/**
 * Upload profile image with validation and error handling
 */
export const uploadProfileImage = async (image: ImageOrVideo): Promise<ImageUploadResult> => {
  try {
    // Validate image first
    const validation = validateImage(image);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    console.log('[ProfileImageUpload] Starting upload for image:', {
      path: image.path,
      size: image.size,
      mime: image.mime,
      width: image.width,
      height: image.height
    });

    // Upload to Cloudflare
    const uploadResult = await CloudflareUploadService.uploadImage(image.path, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8
    });

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload image. Please try again.'
      };
    }

    console.log('[ProfileImageUpload] Upload successful:', uploadResult.url);

    // Process the upload result
    const processedUrl = handleProfileImageUploadResult(uploadResult.url);

    return {
      success: true,
      imageUrl: processedUrl
    };

  } catch (error) {
    console.error('[ProfileImageUpload] Upload error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('User cancelled')) {
        return {
          success: false,
          error: 'Image selection was cancelled.'
        };
      }
      
      if (error.message.includes('permission')) {
        return {
          success: false,
          error: 'Please grant permission to access photos and camera.'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to upload image. Please check your internet connection and try again.'
    };
  }
};

/**
 * Complete profile image update workflow
 */
export const updateProfileImage = async (): Promise<ImageUploadResult> => {
  try {
    // Show picker options
    const selectedImage = await showImagePickerOptions();
    
    if (!selectedImage) {
      return {
        success: false,
        error: 'No image selected.'
      };
    }

    // Upload the image
    return await uploadProfileImage(selectedImage);

  } catch (error) {
    console.error('[ProfileImageUpdate] Error:', error);
    return {
      success: false,
      error: 'Failed to update profile image. Please try again.'
    };
  }
};